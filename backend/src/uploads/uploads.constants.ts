import type { Request } from 'express';
import {
  ALLOWED_CHAT_MIME,
  ALLOWED_MIME,
} from '../common/upload/upload.constants.js';

export const USER_BUCKETS = ['receipts', 'chat'] as const;

export type UserUploadBucket = (typeof USER_BUCKETS)[number];

export const resolveUserBucket = (
  req: { params?: Record<string, unknown> } | undefined,
): UserUploadBucket | null => {
  const raw = String(req?.params?.bucket ?? '').toLowerCase();
  return (USER_BUCKETS as readonly string[]).includes(raw)
    ? (raw as UserUploadBucket)
    : null;
};

const isChatBucket = (req: Request): boolean =>
  resolveUserBucket(req) === 'chat';

export const resolveUserAllowedMime = (req: Request): Set<string> =>
  isChatBucket(req) ? ALLOWED_CHAT_MIME : ALLOWED_MIME;
