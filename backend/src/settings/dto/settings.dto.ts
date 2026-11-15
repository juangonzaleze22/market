import {
  IsString,
  IsOptional,
  IsArray,
  IsHexColor,
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

class ThemeColorsDto {
  @IsHexColor()
  primary: string;

  @IsHexColor()
  onPrimary: string;

  @IsHexColor()
  @IsOptional()
  brand?: string;

  @IsHexColor()
  @IsOptional()
  onBrand?: string;

  @IsHexColor()
  accent: string;

  @IsHexColor()
  onAccent: string;

  @IsHexColor()
  link: string;
}

class ThemeBrandingDto {
  @IsString()
  brandName: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoDarkUrl?: string;

  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @IsString()
  @IsOptional()
  pwaIconUrl?: string;
}

class ThemeDto {
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors: ThemeColorsDto;

  @ValidateNested()
  @Type(() => ThemeBrandingDto)
  branding: ThemeBrandingDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeDto)
  theme?: ThemeDto;
}
