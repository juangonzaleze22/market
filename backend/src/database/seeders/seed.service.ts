import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { hash } from 'bcryptjs';
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

const categoryImages = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_b9b00a13-70e2-46b1-a5e1-299194d07d17.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215226_f6c11cdb-6d15-49be-98fc-04e72cf8c513.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_a057967f-a904-4e21-868a-06e9ac852da9.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215226_7e04efb7-a879-4898-8baf-8edb15a872d0.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_921ab5ab-dbc7-4c21-b497-a7756abf0ca0.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_99885519-cc49-4766-a3a1-459033ef2568.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_b355e44a-56c2-4357-8a04-1ae37109905a.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_05305ba8-ae16-47ed-b067-dfd0e80ec292.png',
];

const productImages = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_75c6644f-b471-456c-84cd-f6c66ac9d5b9.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_01d688bf-edde-4580-b92b-eef64c676f73.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_538a0db6-7afb-41fc-a207-924be258ebfd.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_0c90fb36-d783-4c9c-ae9b-c7d0d97a030b.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_2da8ec51-fdf1-4ed8-931a-5bc65340c248.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_3c0b2bb8-c3fc-4f06-b1fb-4bf7939f81a9.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_bec67b0b-0095-4171-b8b1-e301b868ff53.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_cc68ce5a-a8cb-4ed6-a49b-a119f1e9f66b.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_00a83a91-a547-4e93-9406-3615e9df0157.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_7f91c816-f3a6-490a-81b6-920867d5b10f.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215431_d63aff0c-ed95-4fd6-8b64-24ed1cd4f6d2.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_62f02fd9-8690-4f61-955b-753914ced305.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_5f85ac28-3e1e-429c-8b5a-61aa918bc521.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_28d0512a-9474-4e77-bc31-3330837cb2b2.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215351_09d6f8b4-28d7-4a4b-b24e-99e240470a66.png',
  'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215431_8293f9fd-c714-4d42-8a84-1b5f52b0904f.png',
];

const categoriesSeed = [
  { name: 'Electrónica', slug: 'electronica', description: 'Dispositivos y gadgets', imageUrl: categoryImages[0], icon: 'laptop' },
  { name: 'Ropa', slug: 'ropa', description: 'Moda y accesorios', imageUrl: categoryImages[1], icon: 'shirt' },
  { name: 'Hogar', slug: 'hogar', description: 'Para tu casa', imageUrl: categoryImages[2], icon: 'home' },
  { name: 'Deportes', slug: 'deportes', description: 'Equipo y vida activa', imageUrl: categoryImages[3], icon: 'trophy' },
  { name: 'Belleza', slug: 'belleza', description: 'Cuidado personal', imageUrl: categoryImages[4], icon: 'sparkles' },
  { name: 'Libros', slug: 'libros', description: 'Lectura y papelería', imageUrl: categoryImages[5], icon: 'book-open' },
  { name: 'Juguetes', slug: 'juguetes', description: 'Diversión para todos', imageUrl: categoryImages[6], icon: 'toy-brick' },
  { name: 'Accesorios', slug: 'accesorios', description: 'Complementos diarios', imageUrl: categoryImages[7], icon: 'shopping-bag' },
];

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  categorySlug: string;
  image: string;
  tagSlugs: string[];
  hasDiscount?: boolean;
  discountPercent?: number;
  discountPrice?: number;
};

const tagsSeed = [
  { name: 'Nuevo', slug: 'nuevo', color: '#2563eb' },
  { name: 'Oferta', slug: 'oferta', color: '#dc2626' },
  { name: 'Destacado', slug: 'destacado', color: '#f59e0b' },
  { name: 'Envío gratis', slug: 'envio-gratis', color: '#16a34a' },
  { name: 'Premium', slug: 'premium', color: '#7c3aed' },
  { name: 'Edición limitada', slug: 'edicion-limitada', color: '#db2777' },
];

const productsSeed: ProductSeed[] = [
  { name: 'Auriculares Bluetooth', slug: 'auriculares-bluetooth', description: 'Auriculares inalámbricos con cancelación de ruido', price: 89.99, costPrice: 52.0, stock: 50, sku: 'ELEC-001', categorySlug: 'electronica', image: productImages[0], tagSlugs: ['destacado', 'oferta'], hasDiscount: true, discountPercent: 15 },
  { name: 'Teclado Mecánico', slug: 'teclado-mecanico', description: 'Teclado mecánico compacto con switches táctiles', price: 129.0, costPrice: 78.0, stock: 25, sku: 'ELEC-002', categorySlug: 'electronica', image: productImages[1], tagSlugs: ['premium', 'nuevo'] },
  { name: 'Camiseta Básica', slug: 'camiseta-basica', description: 'Camiseta 100% algodón', price: 19.99, costPrice: 9.5, stock: 100, sku: 'ROPA-001', categorySlug: 'ropa', image: productImages[2], tagSlugs: ['nuevo'] },
  { name: 'Chaqueta Denim', slug: 'chaqueta-denim', description: 'Chaqueta de mezclilla clásica unisex', price: 59.5, costPrice: 32.0, stock: 40, sku: 'ROPA-002', categorySlug: 'ropa', image: productImages[3], tagSlugs: ['destacado', 'premium'] },
  { name: 'Lámpara LED', slug: 'lampara-led', description: 'Lámpara de escritorio regulable', price: 34.99, costPrice: 18.5, stock: 30, sku: 'HOGAR-001', categorySlug: 'hogar', image: productImages[4], tagSlugs: ['nuevo'] },
  { name: 'Set de Toallas', slug: 'set-de-toallas', description: 'Tres toallas de algodón de alta absorción', price: 24.9, costPrice: 12.0, stock: 60, sku: 'HOGAR-002', categorySlug: 'hogar', image: productImages[5], tagSlugs: ['oferta', 'envio-gratis'], hasDiscount: true, discountPrice: 19.9 },
  { name: 'Botella Térmica', slug: 'botella-termica', description: 'Mantiene bebidas frías o calientes por 12 horas', price: 21.0, costPrice: 10.5, stock: 80, sku: 'DEP-001', categorySlug: 'deportes', image: productImages[6], tagSlugs: ['envio-gratis'] },
  { name: 'Esterilla de Yoga', slug: 'esterilla-de-yoga', description: 'Esterilla antideslizante de 6mm', price: 27.75, costPrice: 14.0, stock: 45, sku: 'DEP-002', categorySlug: 'deportes', image: productImages[7], tagSlugs: ['nuevo'] },
  { name: 'Jabón Artesanal', slug: 'jabon-artesanal', description: 'Jabón natural de lavanda hecho a mano', price: 6.5, costPrice: 2.5, stock: 120, sku: 'BEL-001', categorySlug: 'belleza', image: productImages[8], tagSlugs: ['nuevo'] },
  { name: 'Crema Hidratante', slug: 'crema-hidratante', description: 'Hidratación profunda para todo tipo de piel', price: 15.25, costPrice: 7.0, stock: 70, sku: 'BEL-002', categorySlug: 'belleza', image: productImages[9], tagSlugs: ['destacado'] },
  { name: 'Novela de Misterio', slug: 'novela-de-misterio', description: 'Bestseller de suspenso en tapa suave', price: 12.99, costPrice: 6.5, stock: 55, sku: 'LIB-001', categorySlug: 'libros', image: productImages[10], tagSlugs: ['oferta'] },
  { name: 'Recetario de Cocina', slug: 'recetario-de-cocina', description: 'Más de 100 recetas para cada día', price: 18.4, costPrice: 9.0, stock: 35, sku: 'LIB-002', categorySlug: 'libros', image: productImages[11], tagSlugs: ['nuevo'] },
  { name: 'Set de Bloques', slug: 'set-de-bloques', description: '250 piezas compatibles y apilables', price: 29.99, costPrice: 15.5, stock: 48, sku: 'JUG-001', categorySlug: 'juguetes', image: productImages[12], tagSlugs: ['oferta', 'envio-gratis'], hasDiscount: true, discountPercent: 20 },
  { name: 'Peluche de Oso', slug: 'peluche-de-oso', description: 'Suave y abrazable, 40cm', price: 14.5, costPrice: 6.75, stock: 65, sku: 'JUG-002', categorySlug: 'juguetes', image: productImages[13], tagSlugs: ['nuevo'] },
  { name: 'Mochila Urbana', slug: 'mochila-urbana', description: 'Resistente al agua con compartimento para laptop', price: 45.0, costPrice: 24.0, stock: 38, sku: 'ACC-001', categorySlug: 'accesorios', image: productImages[14], tagSlugs: ['destacado', 'envio-gratis'] },
  { name: 'Reloj Minimalista', slug: 'reloj-minimalista', description: 'Carátula limpia con correa intercambiable', price: 75.0, costPrice: 40.0, stock: 0, sku: 'ACC-002', categorySlug: 'accesorios', image: productImages[15], tagSlugs: ['premium', 'edicion-limitada'] },
];

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
    private readonly dataSource: DataSource,
  ) {}

  async run() {
    await this.seedTestUser();
    await this.seedAdminUser();
    await this.seedWarehouseUser();
    await this.seedDeliveryUser();

    const defaultBranch = await this.ensureDefaultBranch();
    await this.assignStaffToBranch(defaultBranch.id);

    const categoryCount = await this.categoryRepository.count();
    const orderCount = await this.orderRepository.count();
    const productCount = await this.productRepository.count();

    if (categoryCount > 0 && (orderCount > 0 || productCount >= productsSeed.length)) {
      console.log('Seeders ya ejecutados previamente. Sincronizando iconos, costos y datos faltantes...');
      for (const category of categoriesSeed) {
        await this.categoryRepository.update({ slug: category.slug }, { icon: category.icon });
      }
      await this.backfillProductFields();
      await this.backfillBranchData(defaultBranch.id);
      return;
    }

    if (categoryCount > 0) {
      await this.truncateSeededTables();
    }

    const createdCategories = new Map<string, Category>();

    for (const category of categoriesSeed) {
      const created = this.categoryRepository.create(category);
      const saved = await this.categoryRepository.save(created);
      createdCategories.set(category.slug, saved);
    }

    const createdTags = await this.ensureTags();

    for (const product of productsSeed) {
      const category = createdCategories.get(product.categorySlug);
      if (!category) continue;

      const tags = product.tagSlugs
        .map((slug) => createdTags.get(slug))
        .filter((tag): tag is Tag => Boolean(tag));

      const created = this.productRepository.create({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        sku: product.sku,
        images: [product.image],
        featuredImage: product.image,
        isActive: true,
        hasDiscount: product.hasDiscount ?? false,
        discountPercent: product.discountPercent ?? null,
        discountPrice: product.discountPrice ?? null,
        categoryId: category.id,
        tags,
      });
      await this.productRepository.save(created);
    }

    await this.backfillBranchData(defaultBranch.id);

    console.log('Seeders ejecutados correctamente.');
  }

  private async truncateSeededTables(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE TABLE "cart_items", "branch_product_stock", "products", "categories" RESTART IDENTITY CASCADE;',
    );
  }

  private async ensureTags(): Promise<Map<string, Tag>> {
    const tags = new Map<string, Tag>();

    for (const seed of tagsSeed) {
      let tag = await this.tagRepository.findOne({ where: { slug: seed.slug } });
      if (!tag) {
        tag = await this.tagRepository.save(this.tagRepository.create(seed));
      }
      tags.set(seed.slug, tag);
    }

    return tags;
  }

  private async backfillProductFields(): Promise<void> {
    const tagMap = await this.ensureTags();
    const products = await this.productRepository.find();
    const seedBySlug = new Map(productsSeed.map((seed) => [seed.slug, seed]));

    for (const product of products) {
      const seed = seedBySlug.get(product.slug);
      if (!seed) continue;

      let changed = false;
      if (product.costPrice === null || Number(product.costPrice) <= 0) {
        product.costPrice = seed.costPrice;
        changed = true;
      }
      if (!product.featuredImage) {
        product.featuredImage = seed.image;
        changed = true;
      }
      if ((!product.tags || product.tags.length === 0) && seed.tagSlugs.length > 0) {
        product.tags = seed.tagSlugs
          .map((slug) => tagMap.get(slug))
          .filter((tag): tag is Tag => Boolean(tag));
        changed = true;
      }

      if (changed) {
        await this.productRepository.save(product);
      }
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

  private async backfillBranchData(branchId: string): Promise<void> {
    await this.orderRepository
      .createQueryBuilder()
      .update(Order)
      .set({ branchId })
      .where('branchId IS NULL')
      .execute();

    await this.addressRepository
      .createQueryBuilder()
      .update(Address)
      .set({ branchId })
      .where('branchId IS NULL')
      .execute();

    const products = await this.productRepository.find();
    const existingRows = await this.branchStockRepository.find({
      where: { branchId },
    });
    const existingProductIds = new Set(
      existingRows.map((row) => row.productId),
    );

    for (const product of products) {
      if (existingProductIds.has(product.id)) continue;
      const row = this.branchStockRepository.create({
        branchId,
        productId: product.id,
        stock: product.stock,
      });
      await this.branchStockRepository.save(row);
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
