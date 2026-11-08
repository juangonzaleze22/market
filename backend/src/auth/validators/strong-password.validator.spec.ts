import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsStrongPassword } from './strong-password.validator.js';

class PasswordDto {
  @IsStrongPassword()
  password: string;

  constructor(password: string) {
    this.password = password;
  }
}

function isValid(password: string): boolean {
  return validateSync(new PasswordDto(password)).length === 0;
}

describe('IsStrongPassword', () => {
  it('acepta contraseñas con longitud, letra y número', () => {
    expect(isValid('Market1234')).toBe(true);
    expect(isValid('claveSegura2026')).toBe(true);
  });

  it('rechaza contraseñas débiles o comunes', () => {
    expect(isValid('abcdefgh')).toBe(false);
    expect(isValid('12345678')).toBe(false);
    expect(isValid('password123')).toBe(false);
    expect(isValid('Ab1')).toBe(false);
    expect(isValid('A1'.repeat(40))).toBe(false);
  });
});
