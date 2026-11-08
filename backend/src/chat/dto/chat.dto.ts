import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChatAttachmentDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  type: string;

  @IsInt()
  @Min(0)
  size: number;
}

export class SendMessageBodyDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
}

export class SendMessageDto extends SendMessageBodyDto {
  @IsString()
  orderId: string;
}
