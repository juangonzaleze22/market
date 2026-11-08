import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity.js';
import { FlashSale } from './flash-sale.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  flashSaleId: string;

  @ManyToOne(() => FlashSale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'flashSaleId' })
  flashSale: FlashSale;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ type: 'boolean', default: false })
  picked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  pickedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  pickedById: string | null;
}
