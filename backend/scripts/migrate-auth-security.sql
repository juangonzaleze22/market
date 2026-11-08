-- Migración de seguridad de autenticación (producción)
-- Ejecutar una sola vez antes de desplegar la versión con verificación de correo.
-- En desarrollo `synchronize: true` crea las columnas automáticamente.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamp NULL,
  ADD COLUMN IF NOT EXISTS "emailVerificationTokenHash" varchar NULL,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" timestamp NULL,
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" varchar NULL,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" timestamp NULL,
  ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" timestamp NULL,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp NULL;

-- Normaliza correos existentes para que la unicidad sea case-insensitive.
UPDATE users
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

-- Marca como verificadas las cuentas previas a esta versión.
-- Las cuentas nuevas siempre tienen emailVerificationTokenHash, por lo que
-- este UPDATE no las afecta.
UPDATE users
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL
  AND "emailVerificationTokenHash" IS NULL
  AND "emailVerificationExpiresAt" IS NULL;

COMMIT;
