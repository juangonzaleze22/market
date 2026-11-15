import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { ADMIN_EMAIL, ADMIN_PASSWORD, API_URL } from '../helpers/api';

test.describe('Apariencia configurable', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin/settings');
    await expect(page.locator('[data-testid="settings-theme"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('previsualiza un nuevo color primario sin guardar', async ({ page }) => {
    const hex = page.locator('[data-testid="settings-hex-primary"]');
    await hex.fill('#ff0000');
    await hex.blur();

    const applied = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim()
        .toLowerCase(),
    );
    expect(applied).toBe('#ff0000');

    await page.click('[data-testid="settings-theme-reset"]');
    const reset = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim()
        .toLowerCase(),
    );
    expect(reset).toBe('#1c8057');
  });

  test('avisa cuando el contraste no alcanza 4.5:1', async ({ page }) => {
    await page.locator('[data-testid="settings-hex-accent"]').fill('#ffff00');
    await page.locator('[data-testid="settings-hex-onAccent"]').fill('#ffffff');

    await expect(
      page.locator('[data-testid="settings-contrast-warning"]'),
    ).toBeVisible();
  });

  test('el nombre de marca se refleja en el título', async ({ page }) => {
    await page
      .locator('[data-testid="settings-brand-name"]')
      .fill('Mercado Test');

    await expect(page).toHaveTitle('Mercado Test');
  });
});

test.describe('Tema persistido', () => {
  test('aplica colores y marca al iniciar la app', async ({ page, request }) => {
    const response = await request.get(`${API_URL}/settings`);
    expect(response.ok()).toBeTruthy();
    const settings = await response.json();
    test.skip(!settings.theme, 'El backend no expone theme todavía');

    await page.goto('/');
    await expect(page.locator('[data-testid="logo"] img')).toHaveAttribute(
      'alt',
      settings.theme.branding.brandName,
    );

    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim()
        .toLowerCase(),
    );
    expect(primary).toBe(settings.theme.colors.primary.toLowerCase());
    await expect(page).toHaveTitle(settings.theme.branding.brandName);
  });
});
