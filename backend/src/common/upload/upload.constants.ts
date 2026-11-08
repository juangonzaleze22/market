import { resolve } from 'node:path';

export const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? 'uploads';
export const UPLOAD_DIR = resolve(process.cwd(), UPLOAD_ROOT);
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const MAX_CHAT_UPLOAD_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export const ALLOWED_CHAT_MIME = new Set([
  ...ALLOWED_MIME,
  'application/pdf',
]);

export const ALLOWED_CHAT_EXT = new Set([...ALLOWED_EXT, '.pdf']);
