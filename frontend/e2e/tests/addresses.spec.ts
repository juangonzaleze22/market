import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';

test.describe('Gestión de direcciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
  });

  test('permite crear, editar y eliminar una dirección', async ({ page }) => {
    await page.goto('/account/addresses');
    await expect(page.locator('[data-testid="addresses-page"]')).toBeVisible({ timeout: 10000 });

    const label = `E2E ${Date.now()}`;

    // Crear
    await page.click('[data-testid="add-address"]');
    await expect(page.locator('[data-testid="address-form"]')).toBeVisible();
    await page.fill('[data-testid="address-form-label"]', label);
    await page.fill('[data-testid="address-form-street"]', 'Calle Test 123');
    await page.fill('[data-testid="address-form-city"]', 'Guanare');
    await page.fill('[data-testid="address-form-state"]', 'Portuguesa');
    await page.fill('[data-testid="address-form-zip"]', '3301');
    await page.fill('[data-testid="address-form-country"]', 'Venezuela');
    await page.click('[data-testid="address-form-submit"]');

    const card = page.locator('[data-testid="address-card"]', { hasText: label });
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('[data-testid="address-card-street"]')).toHaveText('Calle Test 123');

    // Editar
    await card.locator('[data-testid="address-edit"]').click();
    await expect(page.locator('[data-testid="address-form"]')).toBeVisible();
    await page.fill('[data-testid="address-form-street"]', 'Calle Editada 456');
    await page.click('[data-testid="address-form-submit"]');

    await expect(card.locator('[data-testid="address-card-street"]')).toHaveText('Calle Editada 456', {
      timeout: 10000,
    });

    // Eliminar
    await card.locator('[data-testid="address-delete"]').click();
    await expect(page.locator('[data-testid="address-delete-modal"]')).toBeVisible();
    await page.click('[data-testid="address-delete-confirm"]');
    await expect(page.locator('[data-testid="address-card"]', { hasText: label })).toHaveCount(0, {
      timeout: 10000,
    });
  });

  test('valida los campos requeridos', async ({ page }) => {
    await page.goto('/account/addresses');
    await expect(page.locator('[data-testid="addresses-page"]')).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="add-address"]');
    await page.click('[data-testid="address-form-submit"]');

    await expect(page.locator('[data-testid="address-form-street-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-form-city-error"]')).toBeVisible();
  });
});
