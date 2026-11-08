import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBannerSettingsDto {
  @IsString()
  @IsOptional()
  transitionEffect?: string;

  @IsNumber()
  @IsOptional()
  autoplayDelay?: number;

  @IsString()
  @IsOptional()
  animationType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
