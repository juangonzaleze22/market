import { test, expect } from '@playwright/test';

test.describe('Página 404', () => {
  test('muestra la vista 404 en una ruta inexistente', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');

    await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-code"]')).toHaveText('404');
    await expect(page.locator('[data-testid="not-found-title"]')).toHaveText(
      'Página no encontrada',
    );
  });

  test('el botón de inicio navega al home', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');

    await page.click('[data-testid="not-found-home-link"]');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-testid="not-found-page"]')).toHaveCount(0);
  });

  test('el botón de tienda navega al catálogo', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');

    await page.click('[data-testid="not-found-shop-link"]');

    await expect(page).toHaveURL(/\/shop/);
  });

  test('mantiene el header y footer del sitio', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');

    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});
