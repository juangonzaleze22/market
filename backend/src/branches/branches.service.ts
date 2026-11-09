import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../database/entities/branch.entity.js';
import { DeliveryZone } from '../database/entities/delivery-zone.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { pointInZone } from '../common/utils/geo.util.js';
import {
  CreateBranchDto,
  CreateZoneDto,
  UpdateBranchDto,
  UpdateZoneDto,
} from './dto/branch.dto.js';

export interface ResolvedLocation {
  branch: Branch | null;
  zone: DeliveryZone | null;
}

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(DeliveryZone)
    private readonly zoneRepository: Repository<DeliveryZone>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
  ) {}

  findAllPublic(): Promise<Branch[]> {
    return this.branchRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  findAll(): Promise<Branch[]> {
    return this.branchRepository.find({
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async hasActiveBranches(): Promise<boolean> {
    const count = await this.branchRepository.count({
      where: { isActive: true },
    });
    return count > 0;
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  findZones(branchId: string): Promise<DeliveryZone[]> {
    return this.zoneRepository.find({
      where: { branchId },
      order: { createdAt: 'ASC' },
    });
  }

  async resolvePoint(lat: number, lng: number): Promise<ResolvedLocation> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { branch: null, zone: null };
    }

    const branches = await this.branchRepository.find({
      where: { isActive: true },
    });
    if (branches.length === 0) return { branch: null, zone: null };

    const zones = await this.zoneRepository.find({
      where: { isActive: true },
    });

    const point = { lat, lng };
    for (const zone of zones) {
      if (pointInZone(point, zone)) {
        const branch = branches.find((item) => item.id === zone.branchId);
        if (branch) return { branch, zone };
      }
    }

    return { branch: null, zone: null };
  }

  async resolveForAddress(address: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    city?: string | null;
    state?: string | null;
  }): Promise<ResolvedLocation> {
    if (address.latitude != null && address.longitude != null) {
      return this.resolvePoint(
        Number(address.latitude),
        Number(address.longitude),
      );
    }

    const city = (address.city ?? '').trim();
    const state = (address.state ?? '').trim();
    if (!city) return { branch: null, zone: null };

    const qb = this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.isActive = true')
      .andWhere('LOWER(branch.city) = LOWER(:city)', { city });
    if (state) {
      qb.andWhere('LOWER(branch.state) = LOWER(:state)', { state });
    }
    const branch = await qb.getOne();

    return { branch: branch ?? null, zone: null };
  }

  async resolveBranchById(branchId: string): Promise<Branch> {
    return this.findOne(branchId);
  }

  async matchZone(
    branchId: string,
    lat: number,
    lng: number,
  ): Promise<DeliveryZone | null> {
    const zones = await this.zoneRepository.find({
      where: { branchId, isActive: true },
    });
    return (
      zones.find((zone) => pointInZone({ lat, lng }, zone)) ?? null
    );
  }

  async findDefault(): Promise<Branch | null> {
    const preferred = await this.branchRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
    if (preferred) return preferred;

    return this.branchRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async create(dto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create({
      ...dto,
      country: dto.country ?? 'Venezuela',
    });
    const saved = await this.branchRepository.save(branch);

    if (dto.isDefault) {
      await this.clearOtherDefaults(saved.id);
    }

    await this.ensureBranchStockRows(saved.id);

    return saved;
  }

  private async ensureBranchStockRows(branchId: string): Promise<void> {
    const products = await this.productRepository.find();
    if (products.length === 0) return;

    const existingRows = await this.branchStockRepository.find({
      where: { branchId },
    });
    const existingProductIds = new Set(
      existingRows.map((row) => row.productId),
    );

    const missing = products.filter(
      (product) => !existingProductIds.has(product.id),
    );
    if (missing.length === 0) return;

    await this.branchStockRepository.save(
      missing.map((product) =>
        this.branchStockRepository.create({
          branchId,
          productId: product.id,
          stock: 0,
        }),
      ),
    );
  }

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    await this.findOne(id);
    await this.branchRepository.update({ id }, dto);
    if (dto.isDefault) {
      await this.clearOtherDefaults(id);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.zoneRepository.delete({ branchId: id });
    await this.branchStockRepository.delete({ branchId: id });
    await this.branchRepository.delete({ id });
  }

  async createZone(
    branchId: string,
    dto: CreateZoneDto,
  ): Promise<DeliveryZone> {
    await this.findOne(branchId);
    const zone = this.zoneRepository.create({
      ...dto,
      branchId,
      deliveryFee: dto.deliveryFee ?? 0,
    });
    return this.zoneRepository.save(zone);
  }

  async updateZone(
    branchId: string,
    zoneId: string,
    dto: UpdateZoneDto,
  ): Promise<DeliveryZone> {
    const zone = await this.zoneRepository.findOne({
      where: { id: zoneId, branchId },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');

    await this.zoneRepository.update({ id: zoneId, branchId }, dto);
    const updated = await this.zoneRepository.findOne({ where: { id: zoneId } });
    if (!updated) throw new NotFoundException('Zona no encontrada');
    return updated;
  }

  async removeZone(branchId: string, zoneId: string): Promise<void> {
    const zone = await this.zoneRepository.findOne({
      where: { id: zoneId, branchId },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    await this.zoneRepository.delete({ id: zoneId, branchId });
  }

  private async clearOtherDefaults(branchId: string): Promise<void> {
    await this.branchRepository
      .createQueryBuilder()
      .update(Branch)
      .set({ isDefault: false })
      .where('id != :branchId', { branchId })
      .execute();
  }
}
