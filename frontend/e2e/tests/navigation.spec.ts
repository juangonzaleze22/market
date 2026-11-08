import { test, expect } from '@playwright/test';

test.describe('Navegacion basica', () => {
  test('la pagina de inicio carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Market/i);
  });

  test('los estilos del design system se aplican', async ({ page }) => {
    await page.goto('/');
    const interLink = page.locator('link[href*="fonts.googleapis.com/css2?family=Inter"]');
    await expect(interLink).toHaveCount(1);
  });

  test('header, navbar y footer se renderizan', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});
