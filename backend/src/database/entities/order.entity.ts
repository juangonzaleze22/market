import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Address } from './address.entity.js';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'uuid', nullable: true })
  zoneId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  receiptUrl: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  preparedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  preparedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  deliveryId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryAcceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLongitude: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryLocationAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Address, { eager: true })
  @JoinColumn({ name: 'shippingAddressId' })
  shippingAddress: Address;

  @Column()
  shippingAddressId: string;
}
