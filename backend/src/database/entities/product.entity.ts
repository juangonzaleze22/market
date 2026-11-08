import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity.js';
import { Tag } from './tag.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null;

  @Column({ default: 0 })
  stock: number;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'varchar', nullable: true })
  featuredImage: string | null;

  @Column({ default: true })
  isActive: boolean;

  // ─── Discounts ──────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountPrice: number | null;

  @Column({ default: false })
  hasDiscount: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
