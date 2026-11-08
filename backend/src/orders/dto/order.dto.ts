import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  shippingAddressId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  @IsOptional()
  receipt?: string;
}
