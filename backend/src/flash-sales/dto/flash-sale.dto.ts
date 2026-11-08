import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsUUID, Min, Max, IsDateString, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FlashSaleProductDto {
  @ApiProperty({ example: 'uuid-product-1' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateFlashSaleDto {
  @ApiProperty({ example: 'Ofertas de verano' })
  @IsString()
  title: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @ApiProperty({ example: '2026-09-26T10:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-09-27T23:59:59.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxItems?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [FlashSaleProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleProductDto)
  products: FlashSaleProductDto[];
}

export class UpdateFlashSaleDto {
  @ApiPropertyOptional({ example: 'Ofertas de verano' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: '2026-09-26T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-09-27T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxItems?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [FlashSaleProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleProductDto)
  products?: FlashSaleProductDto[];
}
