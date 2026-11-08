import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga `frontend/.env` en `process.env` para los tests E2E.
 * No sobreescribe variables ya definidas en el shell.
 */
export function loadEnv(file = '.env'): void {
  const filePath = resolve(process.cwd(), file);
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();
