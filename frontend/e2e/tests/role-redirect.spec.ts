import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DELIVERY_EMAIL,
  DELIVERY_PASSWORD,
  WAREHOUSE_EMAIL,
  WAREHOUSE_PASSWORD,
} from '../helpers/api';

test.describe('Redirección por rol al iniciar sesión', () => {
  test('el admin es redirigido al dashboard', async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('el usuario de bodega es redirigido a bodega', async ({ page }) => {
    await loginViaModal(page, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);

    await expect(page).toHaveURL(/\/warehouse$/, { timeout: 10000 });
    await expect(page.locator('[data-testid="warehouse-layout"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('el usuario de delivery es redirigido a delivery', async ({ page }) => {
    await loginViaModal(page, DELIVERY_EMAIL, DELIVERY_PASSWORD);

    await expect(page).toHaveURL(/\/delivery$/, { timeout: 10000 });
    await expect(page.locator('[data-testid="delivery-layout"]')).toBeVisible({
      timeout: 10000,
    });
  });
});

