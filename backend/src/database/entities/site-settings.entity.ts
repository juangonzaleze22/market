import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site_settings')
export class SiteSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Top Banner ──────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  topBannerText: string | null;

  @Column({ type: 'varchar', nullable: true })
  topBannerPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  topBannerCtaText: string | null;

  @Column({ type: 'varchar', nullable: true })
  topBannerCtaLink: string | null;

  // ─── Secondary Bar ──────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  deliveryHours: string | null;

  @Column({ type: 'simple-json', nullable: true })
  secondaryLinks: { label: string; url: string }[] | null;

  // ─── Social ─────────────────────────────────────────────────────
  @Column({ type: 'simple-json', nullable: true })
  socialLinks: { platform: string; url: string }[] | null;

  // ─── Promo ──────────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  promoMessage: string | null;

  // ─── Payment Info ───────────────────────────────────────────────
  @Column({ type: 'simple-json', nullable: true })
  paymentInfo: {
    pago_movil?: { bank: string; phone: string; holderName: string; idDocument: string };
    zelle?: { email: string; holderName: string };
  } | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
