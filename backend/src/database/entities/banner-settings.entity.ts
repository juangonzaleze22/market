import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banner_settings')
export class BannerSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'fade' })
  transitionEffect: string;

  @Column({ type: 'int', default: 3000 })
  autoplayDelay: number;

  @Column({ type: 'varchar', default: 'slide' })
  animationType: string;

  @Column({ default: true })
  isActive: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
