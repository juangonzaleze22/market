import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokenMatches(token: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const provided = Buffer.from(hashToken(token), 'utf8');
  const stored = Buffer.from(storedHash, 'utf8');
  if (provided.length !== stored.length) return false;
  return timingSafeEqual(provided, stored);
}

export function expiryFromNow(milliseconds: number): Date {
  return new Date(Date.now() + milliseconds);
}

export function isExpired(date: Date | null): boolean {
  return !date || date.getTime() <= Date.now();
}
