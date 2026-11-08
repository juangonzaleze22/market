import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('branch_product_stock')
@Index(['productId', 'branchId'], { unique: true })
export class BranchProductStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
