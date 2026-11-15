import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import type { Collection } from './collection.entity.js';
import { Product } from './product.entity.js';

@Entity('collection_products')
@Unique(['collectionId', 'productId'])
export class CollectionProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  collectionId: string;

  @ManyToOne('Collection', (collection: any) => collection.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  position: number;
}
