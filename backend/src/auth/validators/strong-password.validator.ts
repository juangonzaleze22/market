import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'contrasena',
  'contrasena1',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'admin123',
  'admin1234',
  'welcome123',
  'abc12345',
  'letmein1',
  'football',
  'baseball',
  'superman',
  'trustno1',
  'sunshine',
  'princess',
  'dragon123',
  'monkey123',
  'master123',
  'shadow123',
  'michael1',
  'jennifer1',
  'computer',
  'corvette',
]);

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          if (value.length < 8 || value.length > 72) return false;
          if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return false;
          return !COMMON_PASSWORDS.has(value.toLowerCase());
        },
        defaultMessage() {
          return 'La contraseña debe tener entre 8 y 72 caracteres, incluir al menos una letra y un número, y no ser una contraseña común';
        },
      },
    });
  };
}
