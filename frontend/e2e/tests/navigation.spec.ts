import { test, expect } from '@playwright/test';

test.describe('Navegacion basica', () => {
  test('la pagina de inicio carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="home-greeting"]')).toBeVisible();
  });

  test('los estilos del design system se aplican', async ({ page }) => {
    await page.goto('/');
    const fontLink = page.locator('link[href*="fonts.googleapis.com/css2?family=Montserrat"]');
    await expect(fontLink).toHaveCount(1);
    await expect(fontLink).toHaveAttribute('href', /Roboto/);
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
      await expect(page.locator('[data-testid="profile-button"]')).toBeHidden();
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

  test('mobile muestra el título de la vista en subpáginas', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'solo mobile');
    await page.goto('/about');
    await expect(page.getByTestId('header-title')).toHaveText('Quiénes somos');
    await expect(page.getByTestId('header-search-input')).toBeHidden();
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

  test('al redimensionar de mobile a desktop la navbar queda pegada al header', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'solo desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/shop');
    await expect(page.getByTestId('navbar')).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId('navbar')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 400));

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const header = document.querySelector('[data-testid="header"]')!;
            const navbar = document.querySelector('[data-testid="navbar"]')!;
            return Math.abs(
              Math.round(
                navbar.getBoundingClientRect().top -
                  header.getBoundingClientRect().bottom,
              ),
            );
          }),
        { message: 'la navbar debe quedar pegada al header tras el resize' },
      )
      .toBeLessThanOrEqual(1);
  });
});
