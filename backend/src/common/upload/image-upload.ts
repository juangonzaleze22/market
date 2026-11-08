import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { ALLOWED_MIME } from './upload.constants.js';

export type BucketResolver = (
  req: { params?: Record<string, unknown> } | undefined,
) => string | null;

type AllowedMimeResolver = (req: Request) => Set<string>;

export const createUploadFileFilter =
  (
    resolveBucket: BucketResolver,
    resolveAllowedMime: AllowedMimeResolver = () => ALLOWED_MIME,
    errorMessage = 'Formato no permitido. Usa JPEG, PNG, WEBP o GIF',
  ) =>
  (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ): void => {
    if (!resolveBucket(req)) {
      cb(new BadRequestException('Carpeta de destino inválida'), false);
      return;
    }
    if (!resolveAllowedMime(req).has(file.mimetype)) {
      cb(new BadRequestException(errorMessage), false);
      return;
    }
    cb(null, true);
  };

export const createImageFileFilter = (resolveBucket: BucketResolver) =>
  createUploadFileFilter(resolveBucket);
