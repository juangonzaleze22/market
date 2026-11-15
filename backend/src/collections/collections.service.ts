import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../database/entities/collection.entity.js';
import { CollectionProduct } from '../database/entities/collection-product.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { ProductsService } from '../products/products.service.js';
import {
  CreateCollectionDto,
  ReplaceCollectionProductsDto,
  UpdateCollectionDto,
} from './dto/collection.dto.js';

export const MIN_VISIBLE_COLLECTION_PRODUCTS = 4;

type SuggestionRule = 'NEWEST' | 'BEST_SELLERS' | 'ON_SALE' | 'CATEGORY' | 'TAG';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(CollectionProduct)
    private readonly collectionProductRepository: Repository<CollectionProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
    private readonly productsService: ProductsService,
  ) {}

  private async findActive(): Promise<Collection[]> {
    const now = new Date();
    return this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.isActive = true')
      .andWhere('(collection.startsAt IS NULL OR collection.startsAt <= :now)', {
        now,
      })
      .andWhere('(collection.endsAt IS NULL OR collection.endsAt >= :now)', {
        now,
      })
      .orderBy('collection.sortOrder', 'ASC')
      .addOrderBy('collection.createdAt', 'DESC')
      .getMany();
  }

  private withinWindow(collection: Collection): boolean {
    const now = Date.now();
    if (collection.startsAt && new Date(collection.startsAt).getTime() > now) {
      return false;
    }
    if (collection.endsAt && new Date(collection.endsAt).getTime() < now) {
      return false;
    }
    return true;
  }

  private hasPlacement(collection: Collection, placement: string): boolean {
    return (collection.placements ?? []).includes(placement);
  }

  private async resolveProducts(
    collection: Collection,
    branchId?: string,
    limit?: number,
  ): Promise<any[]> {
    const links = await this.collectionProductRepository.find({
      where: { collectionId: collection.id },
      order: { position: 'ASC' },
    });
    const ids = links.map((link) => link.productId);
    if (ids.length === 0) return [];

    const products = await this.productsService.findAll({
      ids,
      branchId,
      inStock: true,
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const ordered = ids
      .map((id) => byId.get(id))
      .filter((product): product is any => Boolean(product));

    return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
  }

  private async findAvailableProductIds(
    productIds: string[],
    branchId?: string,
  ): Promise<Set<string>> {
    if (productIds.length === 0) return new Set();

    const qb = this.productRepository
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .where('product.id IN (:...productIds)', { productIds })
      .andWhere('product.isActive = true');

    if (branchId) {
      qb.innerJoin(
        BranchProductStock,
        'branchStock',
        'branchStock.productId = product.id AND branchStock.branchId = :branchId',
        { branchId },
      )
        .andWhere('branchStock.isActive = true')
        .andWhere('branchStock.stock > 0');
    } else {
      qb.andWhere('product.stock > 0');
    }

    const rows = await qb.getRawMany<{ id: string }>();
    return new Set(rows.map((row) => row.id));
  }

  async findSections(
    placement: 'home' | 'shop',
    branchId?: string,
  ): Promise<any[]> {
    const collections = (await this.findActive()).filter((collection) =>
      this.hasPlacement(collection, placement),
    );

    if (collections.length === 0) return [];

    if (placement === 'home') {
      const sections: any[] = [];
      for (const collection of collections) {
        const products = await this.resolveProducts(
          collection,
          branchId,
          collection.maxItems ?? 10,
        );
        if (products.length < MIN_VISIBLE_COLLECTION_PRODUCTS) continue;
        sections.push({
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          subtitle: collection.subtitle,
          imageUrl: collection.imageUrl,
          maxItems: collection.maxItems,
          sortOrder: collection.sortOrder,
          products,
        });
      }
      return sections;
    }

    const links = await this.collectionProductRepository.find({
      where: { collectionId: In(collections.map((collection) => collection.id)) },
    });
    const allProductIds = [...new Set(links.map((link) => link.productId))];
    const availableIds = await this.findAvailableProductIds(
      allProductIds,
      branchId,
    );

    return collections
      .map((collection) => {
        const productCount = links.filter(
          (link) =>
            link.collectionId === collection.id &&
            availableIds.has(link.productId),
        ).length;
        return {
          id: collection.id,
          title: collection.title,
          slug: collection.slug,
          subtitle: collection.subtitle,
          imageUrl: collection.imageUrl,
          sortOrder: collection.sortOrder,
          productCount,
        };
      })
      .filter(
        (collection) =>
          collection.productCount >= MIN_VISIBLE_COLLECTION_PRODUCTS,
      );
  }

  async findBySlug(slug: string, branchId?: string): Promise<any> {
    const collection = await this.collectionRepository.findOne({
      where: { slug },
    });
    if (
      !collection ||
      !collection.isActive ||
      !this.withinWindow(collection)
    ) {
      throw new NotFoundException('Colección no encontrada');
    }

    const products = await this.resolveProducts(collection, branchId);

    return {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      subtitle: collection.subtitle,
      imageUrl: collection.imageUrl,
      maxItems: collection.maxItems,
      sortOrder: collection.sortOrder,
      productIds: products.map((product) => product.id),
      products,
    };
  }

  async findAll(page = 1, limit = 10, search = ''): Promise<any> {
    const qb = this.collectionRepository
      .createQueryBuilder('collection')
      .orderBy('collection.sortOrder', 'ASC')
      .addOrderBy('collection.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where(
        '(collection.title ILIKE :search OR collection.slug ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    const counts = new Map<string, number>();
    if (data.length > 0) {
      const rows = await this.collectionProductRepository
        .createQueryBuilder('link')
        .select('link.collectionId', 'collectionId')
        .addSelect('COUNT(*)', 'count')
        .where('link.collectionId IN (:...ids)', {
          ids: data.map((collection) => collection.id),
        })
        .groupBy('link.collectionId')
        .getRawMany<{ collectionId: string; count: string }>();

      for (const row of rows) {
        counts.set(row.collectionId, Number(row.count));
      }
    }

    return {
      data: data.map((collection) => ({
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        subtitle: collection.subtitle,
        imageUrl: collection.imageUrl,
        placements: collection.placements ?? [],
        maxItems: collection.maxItems,
        sortOrder: collection.sortOrder,
        isActive: collection.isActive,
        startsAt: collection.startsAt,
        endsAt: collection.endsAt,
        productCount: counts.get(collection.id) ?? 0,
        createdAt: collection.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Colección no encontrada');
    }

    const links = await this.collectionProductRepository.find({
      where: { collectionId: id },
      order: { position: 'ASC' },
      relations: ['product'],
    });

    return {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      subtitle: collection.subtitle,
      imageUrl: collection.imageUrl,
      placements: collection.placements ?? [],
      maxItems: collection.maxItems,
      sortOrder: collection.sortOrder,
      isActive: collection.isActive,
      startsAt: collection.startsAt,
      endsAt: collection.endsAt,
      createdAt: collection.createdAt,
      products: links.map((link) => ({
        productId: link.productId,
        position: link.position,
        productName: link.product?.name ?? 'Producto eliminado',
        productImage:
          link.product?.featuredImage || link.product?.images?.[0] || null,
        productPrice: link.product ? Number(link.product.price) : 0,
        productStock: link.product?.stock ?? 0,
      })),
    };
  }

  async create(dto: CreateCollectionDto): Promise<any> {
    const existing = await this.collectionRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Ya existe una colección con ese slug');
    }

    const collection = this.collectionRepository.create({
      title: dto.title,
      slug: dto.slug,
      subtitle: dto.subtitle ?? null,
      imageUrl: dto.imageUrl || null,
      placements: dto.placements ?? ['home'],
      maxItems: dto.maxItems ?? 10,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    const saved = await this.collectionRepository.save(collection);

    if (dto.products !== undefined) {
      await this.saveProducts(saved.id, dto.products);
    }

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<any> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Colección no encontrada');
    }

    if (dto.slug && dto.slug !== collection.slug) {
      const existing = await this.collectionRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Ya existe una colección con ese slug');
      }
    }

    if (dto.title !== undefined) collection.title = dto.title;
    if (dto.slug !== undefined) collection.slug = dto.slug;
    if (dto.subtitle !== undefined) collection.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) collection.imageUrl = dto.imageUrl || null;
    if (dto.placements !== undefined) collection.placements = dto.placements;
    if (dto.maxItems !== undefined) collection.maxItems = dto.maxItems;
    if (dto.sortOrder !== undefined) collection.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) collection.isActive = dto.isActive;
    if (dto.startsAt !== undefined) {
      collection.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    }
    if (dto.endsAt !== undefined) {
      collection.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    }

    await this.collectionRepository.save(collection);

    if (dto.products !== undefined) {
      await this.saveProducts(id, dto.products);
    }

    return this.findOne(id);
  }

  async replaceProducts(
    id: string,
    dto: ReplaceCollectionProductsDto,
  ): Promise<any> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Colección no encontrada');
    }
    await this.saveProducts(id, dto.products);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Colección no encontrada');
    }
    await this.collectionRepository.remove(collection);
    return { deleted: true, id };
  }

  async suggestions(
    rule: SuggestionRule,
    options: {
      limit?: number;
      branchId?: string;
      categoryId?: string;
      tagId?: string;
      search?: string;
    } = {},
  ): Promise<any[]> {
    const limit = Math.min(Math.max(options.limit ?? 12, 1), 24);

    switch (rule) {
      case 'BEST_SELLERS':
        return this.productsService.findBestSellers(limit, options.branchId);
      case 'ON_SALE':
        return (
          await this.productsService.findAll({
            branchId: options.branchId,
            inStock: true,
            bestDeals: true,
            search: options.search,
          })
        ).slice(0, limit);
      case 'CATEGORY': {
        if (!options.categoryId) return [];
        return (
          await this.productsService.findAll({
            branchId: options.branchId,
            inStock: true,
            categoryId: options.categoryId,
            search: options.search,
          })
        ).slice(0, limit);
      }
      case 'TAG': {
        if (!options.tagId) return [];
        return (
          await this.productsService.findAll({
            branchId: options.branchId,
            inStock: true,
            tagId: options.tagId,
            search: options.search,
          })
        ).slice(0, limit);
      }
      case 'NEWEST':
      default:
        return (
          await this.productsService.findAll({
            branchId: options.branchId,
            inStock: true,
            search: options.search,
          })
        ).slice(0, limit);
    }
  }

  private async saveProducts(
    collectionId: string,
    products: { productId: string; position?: number }[],
  ): Promise<void> {
    const normalized = [...products]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .filter(
        (product, index, list) =>
          list.findIndex((item) => item.productId === product.productId) ===
          index,
      );

    if (normalized.length > 0) {
      const existing = await this.productRepository.find({
        where: { id: In(normalized.map((product) => product.productId)) },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((product) => product.id));
      const missing = normalized.filter(
        (product) => !existingIds.has(product.productId),
      );
      if (missing.length > 0) {
        throw new BadRequestException('Algunos productos no existen');
      }
    }

    await this.collectionProductRepository.delete({ collectionId });

    if (normalized.length === 0) return;

    await this.collectionProductRepository.save(
      normalized.map((product, index) =>
        this.collectionProductRepository.create({
          collectionId,
          productId: product.productId,
          position: index,
        }),
      ),
    );
  }
}
