import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../validators/strong-password.validator.js';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsStrongPassword()
  password: string;
}
