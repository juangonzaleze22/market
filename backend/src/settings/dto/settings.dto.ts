import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinkDto {
  @IsString()
  platform: string;

  @IsString()
  url: string;
}

class SecondaryLinkDto {
  @IsString()
  label: string;

  @IsString()
  url: string;
}

export class UpdateSiteSettingsDto {
  @IsString()
  @IsOptional()
  topBannerText?: string;

  @IsString()
  @IsOptional()
  topBannerPhone?: string;

  @IsString()
  @IsOptional()
  topBannerCtaText?: string;

  @IsString()
  @IsOptional()
  topBannerCtaLink?: string;

  @IsString()
  @IsOptional()
  deliveryHours?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SecondaryLinkDto)
  secondaryLinks?: SecondaryLinkDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @IsString()
  @IsOptional()
  promoMessage?: string;

  @IsOptional()
  paymentInfo?: {
    pago_movil?: { bank: string; phone: string; holderName: string; idDocument: string };
    zelle?: { email: string; holderName: string };
  };
}
