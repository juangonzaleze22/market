import { IsEmail, IsUUID } from 'class-validator';

export class SubscribeStockDto {
  @IsUUID()
  productId: string;

  @IsEmail()
  email: string;
}
