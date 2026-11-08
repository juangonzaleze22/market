import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { FlashSaleItem } from './flash-sale-item.entity.js';

@Entity('flash_sales')
export class FlashSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  discountPercent: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: 6 })
  maxItems: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('FlashSaleItem', (item: any) => item.flashSale, { eager: true, cascade: true })
  items: FlashSaleItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
