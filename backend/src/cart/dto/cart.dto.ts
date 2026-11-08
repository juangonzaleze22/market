import { IsUUID, IsInt, Min, IsOptional, IsNumber } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsUUID()
  flashSaleId?: string;

  @IsOptional()
  @IsNumber()
  flashSalePrice?: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
