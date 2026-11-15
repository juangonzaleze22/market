import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const COLLECTION_PLACEMENTS = ['home', 'shop'] as const;

export class CollectionProductDto {
  @ApiProperty({ example: 'uuid-product-1' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateCollectionDto {
  @ApiProperty({ example: 'Esencial en tu Despensa' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'esencial-en-tu-despensa' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Los básicos que no pueden faltar' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: '/uploads/collections/cover.webp' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['home', 'shop'], enum: COLLECTION_PLACEMENTS })
  @IsOptional()
  @IsArray()
  @IsIn(['home', 'shop'], { each: true })
  placements?: string[];

  @ApiPropertyOptional({ example: 10, minimum: 4, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(24)
  maxItems?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: [CollectionProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionProductDto)
  products?: CollectionProductDto[];
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({ example: 'Esencial en tu Despensa' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'esencial-en-tu-despensa' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Los básicos que no pueden faltar' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ example: '/uploads/collections/cover.webp' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['home', 'shop'], enum: COLLECTION_PLACEMENTS })
  @IsOptional()
  @IsArray()
  @IsIn(['home', 'shop'], { each: true })
  placements?: string[];

  @ApiPropertyOptional({ example: 10, minimum: 4, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(24)
  maxItems?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional({ type: [CollectionProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionProductDto)
  products?: CollectionProductDto[];
}

export class ReplaceCollectionProductsDto {
  @ApiProperty({ type: [CollectionProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionProductDto)
  products: CollectionProductDto[];
}
