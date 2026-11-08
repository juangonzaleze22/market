import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../database/entities/address.entity.js';
import { BranchesService } from '../branches/branches.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly branchesService: BranchesService,
  ) {}

  findByUser(userId: string): Promise<Address[]> {
    return this.addressRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }
    return address;
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const location = await this.resolveCoverage(dto);
    const address = this.addressRepository.create({
      ...dto,
      userId,
      branchId: location.branchId,
      zoneId: location.zoneId,
    });
    return this.addressRepository.save(address);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const existing = await this.findOne(userId, id);
    const location = await this.resolveCoverage({
      latitude: dto.latitude ?? existing.latitude,
      longitude: dto.longitude ?? existing.longitude,
      city: dto.city ?? existing.city,
      state: dto.state ?? existing.state,
    });
    await this.addressRepository.update(
      { id, userId },
      { ...dto, branchId: location.branchId, zoneId: location.zoneId },
    );
    return this.findOne(userId, id);
  }

  private async resolveCoverage(input: {
    latitude?: number | null;
    longitude?: number | null;
    city?: string | null;
    state?: string | null;
  }): Promise<{ branchId: string | null; zoneId: string | null }> {
    const hasCoordinates = input.latitude != null && input.longitude != null;

    const resolved = await this.branchesService.resolveForAddress(input);

    if (
      hasCoordinates &&
      !resolved.branch &&
      (await this.branchesService.hasActiveBranches())
    ) {
      throw new BadRequestException(
        'La dirección seleccionada está fuera de la cobertura de nuestras sucursales',
      );
    }

    return {
      branchId: resolved.branch?.id ?? null,
      zoneId: resolved.zone?.id ?? null,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.addressRepository.delete({ id, userId });
  }
}
