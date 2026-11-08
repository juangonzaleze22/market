import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ZonePoint } from '../../database/entities/delivery-zone.entity.js';

export class CreateBranchDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  addressLine?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  deliveryHours?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  addressLine?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  deliveryHours?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsArray()
  @IsOptional()
  polygon?: ZonePoint[];

  @IsNumber()
  @IsOptional()
  centerLat?: number;

  @IsNumber()
  @IsOptional()
  centerLng?: number;

  @IsNumber()
  @IsOptional()
  radiusKm?: number;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  polygon?: ZonePoint[];

  @IsNumber()
  @IsOptional()
  centerLat?: number;

  @IsNumber()
  @IsOptional()
  centerLng?: number;

  @IsNumber()
  @IsOptional()
  radiusKm?: number;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
