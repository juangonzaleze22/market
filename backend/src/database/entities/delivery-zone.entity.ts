import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ZonePoint {
  lat: number;
  lng: number;
}

@Entity('delivery_zones')
export class DeliveryZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  polygon: ZonePoint[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  centerLng: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  radiusKm: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
