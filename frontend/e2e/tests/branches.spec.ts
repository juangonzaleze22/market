import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';

test.describe('Sucursales', () => {
  test('el botón flotante permite elegir una sucursal', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="branch-switcher-button"]');
    const modal = page.locator('[data-testid="branch-switcher"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(
      modal.locator('[data-testid^="branch-option-"]').first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="branch-use-location"]'),
    ).toBeVisible();
  });

  test('el admin puede crear y eliminar una sucursal', async ({ page }) => {
    await loginViaModal(page, 'admin@example.com', 'admin123');
    await page.goto('/admin/branches');
    await expect(page.locator('[data-testid="admin-branches"]')).toBeVisible({
      timeout: 10000,
    });

    const name = `E2E Sucursal ${Date.now()}`;
    await page.click('[data-testid="new-branch"]');
    await expect(page.locator('[data-testid="branch-form"]')).toBeVisible();

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="slug"]', `e2e-${Date.now()}`);
    await page.fill('input[name="city"]', 'Guanare');
    await page.fill('input[name="state"]', 'Portuguesa');
    await page.click('[data-testid="branch-form"] button[type="submit"]');

    const card = page.locator('[data-testid="branch-list"] button', {
      hasText: name,
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.click();
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar' }).first().click();

    await expect(card).toHaveCount(0, { timeout: 10000 });
  });
});
