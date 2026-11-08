import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageProfile {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export interface OptimizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export const MAX_INPUT_PIXELS = 25_000_000;

export const IMAGE_PROFILES: Record<string, ImageProfile> = {
  products: { maxWidth: 1200, maxHeight: 1200, quality: 82 },
  categories: { maxWidth: 800, maxHeight: 800, quality: 82 },
  banners: { maxWidth: 1920, maxHeight: 1920, quality: 82 },
  receipts: { maxWidth: 2000, maxHeight: 2000, quality: 85 },
  chat: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
};

const DEFAULT_PROFILE: ImageProfile = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 82,
};

export const getImageProfile = (bucket: string): ImageProfile =>
  IMAGE_PROFILES[bucket] ?? DEFAULT_PROFILE;

export const optimizeImageToWebp = async (
  input: Buffer,
  bucket: string,
): Promise<OptimizedImage> => {
  const profile = getImageProfile(bucket);

  try {
    const image = sharp(input, {
      failOn: 'error',
      limitInputPixels: MAX_INPUT_PIXELS,
    });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('La imagen no tiene dimensiones válidas');
    }

    const { data, info } = await image
      .rotate()
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: profile.quality, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      size: info.size,
    };
  } catch {
    throw new BadRequestException('La imagen no es válida o está dañada');
  }
};
