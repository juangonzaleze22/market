import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { UPLOAD_DIR } from './upload.constants.js';

const buildFilename = (extension: string): string =>
  `${Date.now()}-${randomUUID()}${extension}`;

const saveBuffer = async (
  buffer: Buffer,
  bucket: string,
  extension: string,
): Promise<string> => {
  const dir = join(UPLOAD_DIR, bucket);
  mkdirSync(dir, { recursive: true });

  const filename = buildFilename(extension);
  await writeFile(join(dir, filename), buffer, { flag: 'wx' });

  return filename;
};

export const buildWebpFilename = (): string => buildFilename('.webp');

export const saveWebpImage = async (
  buffer: Buffer,
  bucket: string,
): Promise<string> => saveBuffer(buffer, bucket, '.webp');

export const saveRawUpload = async (
  buffer: Buffer,
  bucket: string,
  extension: string,
): Promise<string> => saveBuffer(buffer, bucket, extension.toLowerCase());

export const buildUploadUrl = (bucket: string, filename: string): string => {
  const base = (
    process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  ).replace(/\/+$/, '');

  return `${base}/uploads/${bucket}/${filename}`;
};
