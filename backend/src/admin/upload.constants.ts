export {
  ALLOWED_EXT,
  ALLOWED_MIME,
  MAX_UPLOAD_SIZE,
  UPLOAD_DIR,
  UPLOAD_ROOT,
} from '../common/upload/upload.constants.js';

export const ALLOWED_BUCKETS = ['products', 'categories', 'banners'] as const;

export type UploadBucket = (typeof ALLOWED_BUCKETS)[number];

export const resolveBucket = (
  req: { params?: Record<string, unknown> } | undefined,
): UploadBucket | null => {
  const raw = String(req?.params?.bucket ?? '').toLowerCase();
  return (ALLOWED_BUCKETS as readonly string[]).includes(raw)
    ? (raw as UploadBucket)
    : null;
};
