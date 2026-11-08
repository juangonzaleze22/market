import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MessageSenderRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  DELIVERY = 'delivery',
  SYSTEM = 'system',
}

export interface ChatAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

@Entity('order_messages')
export class OrderMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @Column({
    type: 'enum',
    enum: MessageSenderRole,
    default: MessageSenderRole.CUSTOMER,
  })
  senderRole: MessageSenderRole;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments: ChatAttachment[];

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
