import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './email.util.js';

describe('normalizeEmail', () => {
  it('elimina espacios y pasa a minúsculas', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});
