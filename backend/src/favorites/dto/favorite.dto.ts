import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  productId: string;
}
