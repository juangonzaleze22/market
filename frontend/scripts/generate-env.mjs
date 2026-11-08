/**
 * Genera los archivos de environment de Angular a partir de `.env` y
 * `.env.production`.
 *
 * Angular se ejecuta en el navegador y no puede leer `process.env`, así que
 * las variables se materializan en `src/environments/*.generated.ts` antes de
 * cada `start` / `build` / `test`.
 *
 * Uso: node scripts/generate-env.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const environmentsDir = resolve(rootDir, 'src/environments');

const DEFAULTS = {
  API_URL: 'http://localhost:3000/api',
  SOCKET_URL: 'http://localhost:3000',
  OSRM_URL: 'https://router.project-osrm.org',
  MAP_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  MAP_TILE_ATTRIBUTION: '&copy; OpenStreetMap contributors',
  MAP_CENTER_LAT: '9.0422',
  MAP_CENTER_LNG: '-69.7423',
  MAP_ZOOM: '15',
  MAP_PICKER_ZOOM: '14',
  CURRENCY_CODE: 'USD',
  LOCALE: 'en-US',
  DEFAULT_CITY: 'Guanare',
  DEFAULT_STATE: 'Portuguesa',
  DEFAULT_ZIP_CODE: '3301',
  DEFAULT_COUNTRY: 'Venezuela',
  PAGE_SIZE: '10',
  DEFAULT_BANNER_PHONE: '+123-456-789',
};

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const values = {};
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

    values[key] = value.replace(/\\n/g, '\n');
  }
  return values;
}

function readNumber(name, value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`[env] ${name} debe ser numérico, recibido: "${value}"`);
  }
  return parsed;
}

function buildConfig(values) {
  return {
    apiUrl: values.API_URL,
    socketUrl: values.SOCKET_URL,
    osrmUrl: values.OSRM_URL,
    mapTileUrl: values.MAP_TILE_URL,
    mapTileAttribution: values.MAP_TILE_ATTRIBUTION,
    mapCenterLat: readNumber('MAP_CENTER_LAT', values.MAP_CENTER_LAT),
    mapCenterLng: readNumber('MAP_CENTER_LNG', values.MAP_CENTER_LNG),
    mapZoom: readNumber('MAP_ZOOM', values.MAP_ZOOM),
    mapPickerZoom: readNumber('MAP_PICKER_ZOOM', values.MAP_PICKER_ZOOM),
    currencyCode: values.CURRENCY_CODE,
    locale: values.LOCALE,
    defaultCity: values.DEFAULT_CITY,
    defaultState: values.DEFAULT_STATE,
    defaultZipCode: values.DEFAULT_ZIP_CODE,
    defaultCountry: values.DEFAULT_COUNTRY,
    pageSize: readNumber('PAGE_SIZE', values.PAGE_SIZE),
    defaultBannerPhone: values.DEFAULT_BANNER_PHONE,
  };
}

function render(config) {
  const entries = Object.entries(config)
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
    .join('\n');

  return `// ARCHIVO GENERADO AUTOMÁTICAMENTE por scripts/generate-env.mjs.
// No lo edites a mano: cambia .env o .env.production y vuelve a generar.
export const envConfig = {
${entries}
};
`;
}

function writeIfChanged(filePath, content) {
  if (existsSync(filePath) && readFileSync(filePath, 'utf8') === content) return;
  writeFileSync(filePath, content, 'utf8');
}

const devValues = { ...DEFAULTS, ...parseEnvFile(resolve(rootDir, '.env')) };
const prodValues = {
  ...devValues,
  ...parseEnvFile(resolve(rootDir, '.env.production')),
};

writeIfChanged(
  resolve(environmentsDir, 'environment.generated.ts'),
  render(buildConfig(devValues)),
);
writeIfChanged(
  resolve(environmentsDir, 'environment.prod.generated.ts'),
  render(buildConfig(prodValues)),
);

console.log('[env] environments generados desde .env / .env.production');
