import { defineConfig, devices } from '@playwright/test';
import './e2e/helpers/env';

/**
 * Puerto del dev server de Angular. Cada agente/ventana usa uno distinto para
 * no compartir el mismo servidor: E2E_PORT=4210 npm run e2e
 */
const port = Number(process.env['E2E_PORT'] ?? 4200);

/**
 * Servidor externo ya levantado (p. ej. una build estatica en dist/). Si se
 * define, Playwright NO arranca el dev server y usa esta URL como baseURL.
 */
const externalBaseURL = process.env['E2E_BASE_URL'];
const baseURL = externalBaseURL ?? `http://localhost:${port}`;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run start -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env['CI'],
        timeout: 120000,
      },
});
