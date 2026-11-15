import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Category } from '../entities/category.entity.js';
import { Product } from '../entities/product.entity.js';
import { User, UserRole } from '../entities/user.entity.js';
import { Order } from '../entities/order.entity.js';
import { CartItem } from '../entities/cart-item.entity.js';
import { Address } from '../entities/address.entity.js';
import { Branch } from '../entities/branch.entity.js';
import { DeliveryZone } from '../entities/delivery-zone.entity.js';
import { BranchProductStock } from '../entities/branch-product-stock.entity.js';
import { Tag } from '../entities/tag.entity.js';
import { Collection } from '../entities/collection.entity.js';
import { CollectionProduct } from '../entities/collection-product.entity.js';
import { UPLOAD_DIR } from '../../common/upload/upload.constants.js';
import {
  categorySeedList,
  collectionSeedList,
  productSeedList,
  tagSeedList,
} from './catalog.seed.js';

const SEED_IMAGE_SOURCE_DIR = resolve(process.cwd(), 'seed-assets', 'products');
const SEED_IMAGE_BUCKET = 'products';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(DeliveryZone)
    private readonly zoneRepository: Repository<DeliveryZone>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(CollectionProduct)
    private readonly collectionProductRepository: Repository<CollectionProduct>,
    private readonly dataSource: DataSource,
  ) {}

  async run() {
    await this.seedTestUser();
    await this.seedAdminUser();
    await this.seedWarehouseUser();
    await this.seedDeliveryUser();

    const defaultBranch = await this.ensureDefaultBranch();
    await this.assignStaffToBranch(defaultBranch.id);

    const hasCatalogSeed = Boolean(
      await this.productRepository.findOne({
        where: { slug: In(productSeedList.map((product) => product.slug)) },
        select: { id: true },
      }),
    );

    if (!hasCatalogSeed) {
      const categoryCount = await this.categoryRepository.count();
      const productCount = await this.productRepository.count();

      if (categoryCount > 0 || productCount > 0) {
        console.log(
          'Catálogo de bodega no detectado. Limpiando catálogo y pedidos demo...',
        );
        await this.resetCatalogData();
      }
    }

    await this.ensureSeedImages();
    const categories = await this.ensureCategories();
    const tags = await this.ensureTags();
    await this.ensureProducts(categories, tags);
    await this.ensureCollections();
    await this.backfillBranchData();

    console.log('Seeders ejecutados correctamente.');
  }

  private async resetCatalogData(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE TABLE "order_messages", "notifications", "order_items", "orders", "cart_items", "favorites", "flash_sale_items", "flash_sales", "collection_products", "collections", "stock_subscriptions", "branch_product_stock", "product_tags", "products", "categories", "tags" RESTART IDENTITY CASCADE;',
    );
  }

  private async ensureSeedImages(): Promise<void> {
    const targetDir = join(UPLOAD_DIR, SEED_IMAGE_BUCKET);
    await mkdir(targetDir, { recursive: true });

    for (const product of productSeedList) {
      const source = join(SEED_IMAGE_SOURCE_DIR, product.imageFile);
      const target = join(targetDir, product.imageFile);

      if (!existsSync(source)) {
        throw new Error(`Falta la imagen del seed: ${source}`);
      }

      if (!existsSync(target)) {
        await copyFile(source, target);
      }
    }
  }

  private buildProductImageUrl(imageFile: string): string {
    return `/uploads/${SEED_IMAGE_BUCKET}/${imageFile}`;
  }

  private async ensureCategories(): Promise<Map<string, Category>> {
    const categories = new Map<string, Category>();

    for (const seed of categorySeedList) {
      const imageUrl = this.buildProductImageUrl(`${seed.imageSlug}.webp`);
      let category = await this.categoryRepository.findOne({
        where: { slug: seed.slug },
      });

      if (!category) {
        category = this.categoryRepository.create({
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          icon: seed.icon,
          imageUrl,
        });
      } else {
        category.name = seed.name;
        category.description = seed.description;
        category.icon = seed.icon;
        category.imageUrl = imageUrl;
      }

      categories.set(seed.slug, await this.categoryRepository.save(category));
    }

    return categories;
  }

  private async ensureTags(): Promise<Map<string, Tag>> {
    const tags = new Map<string, Tag>();

    for (const seed of tagSeedList) {
      let tag = await this.tagRepository.findOne({ where: { slug: seed.slug } });

      if (!tag) {
        tag = this.tagRepository.create(seed);
      } else {
        tag.name = seed.name;
        tag.color = seed.color;
      }

      tags.set(seed.slug, await this.tagRepository.save(tag));
    }

    return tags;
  }

  private async ensureProducts(
    categories: Map<string, Category>,
    tags: Map<string, Tag>,
  ): Promise<void> {
    for (const seed of productSeedList) {
      const category = categories.get(seed.categorySlug);
      if (!category) continue;

      const imageUrl = this.buildProductImageUrl(seed.imageFile);
      const productTags = seed.tagSlugs
        .map((slug) => tags.get(slug))
        .filter((tag): tag is Tag => Boolean(tag));

      let product = await this.productRepository.findOne({
        where: { slug: seed.slug },
      });

      if (!product) {
        product = this.productRepository.create({ slug: seed.slug });
      }

      product.name = seed.name;
      product.description = seed.description;
      product.price = seed.price;
      product.costPrice = seed.costPrice;
      product.stock = seed.stock;
      product.sku = seed.sku;
      product.images = [imageUrl];
      product.featuredImage = imageUrl;
      product.isActive = true;
      product.hasDiscount = seed.hasDiscount;
      product.discountPercent = seed.discountPercent;
      product.discountPrice = seed.discountPrice;
      product.categoryId = category.id;
      product.tags = productTags;

      await this.productRepository.save(product);
    }
  }

  private async ensureCollections(): Promise<void> {
    const existing = await this.collectionRepository.count();
    if (existing > 0) return;

    const products = await this.productRepository.find({
      select: { id: true, slug: true },
    });
    const productBySlug = new Map(
      products.map((product) => [product.slug, product.id]),
    );

    for (const seed of collectionSeedList) {
      const collection = this.collectionRepository.create({
        title: seed.title,
        slug: seed.slug,
        subtitle: seed.subtitle,
        imageUrl: this.buildProductImageUrl(seed.imageFile),
        placements: seed.placements,
        maxItems: 10,
        sortOrder: seed.sortOrder,
        isActive: true,
      });
      const saved = await this.collectionRepository.save(collection);

      const productIds = seed.productSlugs
        .map((slug) => productBySlug.get(slug))
        .filter((id): id is string => Boolean(id));

      if (productIds.length > 0) {
        await this.collectionProductRepository.save(
          productIds.map((productId, position) =>
            this.collectionProductRepository.create({
              collectionId: saved.id,
              productId,
              position,
            }),
          ),
        );
      }

      console.log(`Colección creada: ${saved.title}`);
    }
  }

  private async ensureDefaultBranch(): Promise<Branch> {
    const existing = await this.branchRepository.findOne({
      where: { slug: 'guanare' },
    });
    if (existing) return existing;

    const branch = this.branchRepository.create({
      name: 'Sucursal Guanare',
      slug: 'guanare',
      code: 'GUA',
      addressLine: 'Guanare, Portuguesa',
      city: 'Guanare',
      state: 'Portuguesa',
      country: 'Venezuela',
      latitude: 9.0422,
      longitude: -69.7423,
      deliveryHours: 'Lun a Sáb, 8:00 - 18:00',
      isActive: true,
      isDefault: true,
    });
    const saved = await this.branchRepository.save(branch);

    const zoneCount = await this.zoneRepository.count({
      where: { branchId: saved.id },
    });
    if (zoneCount === 0) {
      const zone = this.zoneRepository.create({
        branchId: saved.id,
        name: 'Casco urbano de Guanare',
        polygon: [
          { lat: 9.085, lng: -69.78 },
          { lat: 9.085, lng: -69.7 },
          { lat: 9.0, lng: -69.7 },
          { lat: 9.0, lng: -69.78 },
        ],
        centerLat: 9.0422,
        centerLng: -69.7423,
        radiusKm: null,
        deliveryFee: 0,
        isActive: true,
      });
      await this.zoneRepository.save(zone);
    }

    console.log('Sucursal por defecto creada: Guanare');
    return saved;
  }

  private async assignStaffToBranch(branchId: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ branchId })
      .where('role IN (:...roles)', {
        roles: [UserRole.WAREHOUSE, UserRole.DELIVERY],
      })
      .andWhere('branchId IS NULL')
      .execute();
  }

  private async backfillBranchData(): Promise<void> {
    const defaultBranch = await this.branchRepository.findOne({
      where: { isDefault: true },
    });
    const defaultBranchId = defaultBranch?.id;

    if (defaultBranchId) {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ branchId: defaultBranchId })
        .where('branchId IS NULL')
        .execute();

      await this.addressRepository
        .createQueryBuilder()
        .update(Address)
        .set({ branchId: defaultBranchId })
        .where('branchId IS NULL')
        .execute();

      await this.cartItemRepository
        .createQueryBuilder()
        .update(CartItem)
        .set({ branchId: defaultBranchId })
        .where('branchId IS NULL')
        .execute();
    }

    const products = await this.productRepository.find();
    const branches = await this.branchRepository.find();
    if (products.length === 0 || branches.length === 0) return;

    const existingRows = await this.branchStockRepository.find();
    const existingByKey = new Map(
      existingRows.map((row) => [`${row.productId}:${row.branchId}`, row]),
    );

    const rowsToCreate: BranchProductStock[] = [];
    const rowsToUpdate: BranchProductStock[] = [];

    for (const branch of branches) {
      for (const product of products) {
        const key = `${product.id}:${branch.id}`;
        const isDefaultBranch = branch.id === defaultBranchId;
        const existing = existingByKey.get(key);

        if (existing) {
          if (isDefaultBranch && existing.stock !== product.stock) {
            existing.stock = product.stock;
            rowsToUpdate.push(existing);
          }
          continue;
        }

        rowsToCreate.push(
          this.branchStockRepository.create({
            branchId: branch.id,
            productId: product.id,
            stock: isDefaultBranch ? product.stock : 0,
          }),
        );
      }
    }

    if (rowsToCreate.length > 0) {
      await this.branchStockRepository.save(rowsToCreate);
    }

    if (rowsToUpdate.length > 0) {
      await this.branchStockRepository.save(rowsToUpdate);
    }
  }

  private async seedTestUser() {
    const email = 'test@example.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await hash('password', 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      emailVerifiedAt: new Date(),
    });
    await this.userRepository.save(user);
    console.log('Usuario de test creado: test@example.com / password');
  }

  private async seedAdminUser() {
    const email = 'admin@example.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await hash('admin123', 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Market',
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
    });
    await this.userRepository.save(user);
    console.log('Usuario administrador creado: admin@example.com / admin123');
  }

  private async seedWarehouseUser() {
    const email = 'bodega@example.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await hash('bodega123', 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: 'Bodega',
      lastName: 'Market',
      role: UserRole.WAREHOUSE,
      emailVerifiedAt: new Date(),
    });
    await this.userRepository.save(user);
    console.log('Usuario de bodega creado: bodega@example.com / bodega123');
  }

  private async seedDeliveryUser() {
    const email = 'delivery@example.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await hash('delivery123', 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: 'Delivery',
      lastName: 'Market',
      role: UserRole.DELIVERY,
      emailVerifiedAt: new Date(),
    });
    await this.userRepository.save(user);
    console.log('Usuario de delivery creado: delivery@example.com / delivery123');
  }
}
