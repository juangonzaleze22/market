import { describe, expect, it } from 'vitest';
import {
  expiryFromNow,
  generateOpaqueToken,
  hashToken,
  isExpired,
  tokenMatches,
} from './token.util.js';

describe('token.util', () => {
  it('genera tokens opacos únicos', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(30);
  });

  it('hashea de forma determinista y compara de forma segura', () => {
    const token = generateOpaqueToken();
    const stored = hashToken(token);
    expect(stored).toBe(hashToken(token));
    expect(tokenMatches(token, stored)).toBe(true);
    expect(tokenMatches('otro-token', stored)).toBe(false);
    expect(tokenMatches(token, null)).toBe(false);
  });

  it('detecta expiración', () => {
    expect(isExpired(null)).toBe(true);
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isExpired(expiryFromNow(60_000))).toBe(false);
  });
});
