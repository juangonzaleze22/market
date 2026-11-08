import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { FlashSale } from './flash-sale.entity.js';
import { Product } from './product.entity.js';

@Entity('flash_sale_items')
export class FlashSaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flashSaleId: string;

  @ManyToOne('FlashSale', (fs: any) => fs.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashSaleId' })
  flashSale: FlashSale;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
