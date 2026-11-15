import { test, expect } from '@playwright/test';

test.describe('Navegacion basica', () => {
  test('la pagina de inicio carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-greeting"]')).toBeVisible();
  });

  test('los estilos del design system se aplican', async ({ page }) => {
    await page.goto('/');
    const interLink = page.locator('link[href*="fonts.googleapis.com/css2?family=Inter"]');
    await expect(interLink).toHaveCount(1);
  });

  test('header, navbar y footer se renderizan según el dispositivo', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();

    if (isMobile) {
      await expect(page.locator('[data-testid="navbar"]')).toBeHidden();
      await expect(page.locator('[data-testid="footer"]')).toBeHidden();
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="notifications-button"]'),
      ).toBeHidden();
      await expect(page.locator('[data-testid="favorites-button"]')).toBeHidden();
      await expect(
        page.locator('[data-testid="header-address-button"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="header-search-input"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="profile-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
    } else {
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="footer"]')).toBeVisible();
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
    }
  });

  test('mobile muestra botón atrás en rutas que no son tabs', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'solo mobile');
    await page.goto('/about');
    await expect(page.getByTestId('header-back')).toBeVisible();
  });

  test('mobile no muestra botón atrás en un tab', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo mobile');
    await page.goto('/shop');
    await expect(page.getByTestId('header-back')).toHaveCount(0);
  });

  test('mobile: el botón atrás vuelve a la página anterior', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'solo mobile');
    await page.goto('/');
    await page.goto('/about');
    await page.getByTestId('header-back').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('desktop no muestra el botón atrás del header', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'solo desktop');
    await page.goto('/about');
    await expect(page.getByTestId('header-back')).toBeHidden();
  });
});
