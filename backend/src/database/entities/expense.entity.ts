import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExpenseCategory {
  RENT = 'rent',
  REMODELING = 'remodeling',
  INVESTMENT = 'investment',
  SERVICES = 'services',
  PAYROLL = 'payroll',
  MARKETING = 'marketing',
  SUPPLIES = 'supplies',
  OTHER = 'other',
}

export enum ExpenseKind {
  OPERATING = 'operating',
  INVESTMENT = 'investment',
}

@Index('UQ_expense_recurring_date', ['recurringExpenseId', 'date'], {
  unique: true,
})
@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Column({ type: 'enum', enum: ExpenseKind, default: ExpenseKind.OPERATING })
  kind: ExpenseKind;

  @Column()
  description: string;

  @Column({ type: 'varchar', nullable: true })
  supplier: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiptUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  recurringExpenseId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
