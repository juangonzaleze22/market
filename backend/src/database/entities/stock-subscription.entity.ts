import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('stock_subscriptions')
@Unique(['productId', 'email'])
export class StockSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index()
  @Column()
  email: string;

  @Column({ type: 'timestamptz', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
