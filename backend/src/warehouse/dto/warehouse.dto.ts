import { IsBoolean } from 'class-validator';

export class UpdateItemPickedDto {
  @IsBoolean()
  picked: boolean;
}
