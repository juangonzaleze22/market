import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';

test.describe('Dashboard de Usuario', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
  });

  test('muestra el dashboard del usuario con KPIs', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-spent"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-delivered"]')).toBeVisible();
  });

  test('muestra el listado de ordenes recientes', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-testid="orders-section"]')).toBeVisible({ timeout: 10000 });
  });

  test('navega al detalle de una orden como factura', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-testid="orders-section"]')).toBeVisible({ timeout: 10000 });
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    if (count > 0) {
      await orderRows.first().click();
      await expect(page.locator('[data-testid="order-invoice"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="invoice-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-total"]')).toBeVisible();
    }
  });

  test('muestra link Mi Cuenta en el dropdown del perfil', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'en mobile la cuenta se navega desde la página de perfil');
    await page.click('[data-testid="profile-button"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-account"]')).toBeVisible();
  });
});

test.describe('Vista de Factura', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
  });

  test('muestra informacion del pedido y comprobante', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-testid="orders-section"]')).toBeVisible({ timeout: 10000 });
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    if (count > 0) {
      await orderRows.first().click();
      await expect(page.locator('[data-testid="order-invoice"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="invoice-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-item"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="invoice-total"]')).toBeVisible();
    }
  });

  test('boton imprimir esta disponible', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-testid="orders-section"]')).toBeVisible({ timeout: 10000 });
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    if (count > 0) {
      await orderRows.first().click();
      await expect(page.locator('[data-testid="order-invoice"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="print-invoice"]')).toBeVisible();
    }
  });
});

test.describe('Perfil mobile', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
  });

  test('el tab Perfil navega al dashboard', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo mobile');

    await page.goto('/');
    await page.locator('[data-testid="bottom-profile-link"]').click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('acceso a Quiénes somos desde Perfil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo mobile');

    await page.goto('/account');
    await expect(page.locator('[data-testid="mobile-more-menu"]')).toBeVisible({
      timeout: 10000,
    });
    await page.locator('[data-testid="mobile-more-about"]').click();

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('[data-testid="page-hero-title"]')).toHaveText(
      'Quiénes somos',
    );
  });

  test('menú mobile muestra las rutas de la cuenta', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo mobile');

    await page.goto('/account');
    const menu = page.locator('[data-testid="mobile-more-menu"]');
    await expect(menu).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="mobile-more-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-more-addresses"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-more-favorites"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-more-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-more-logout"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-button"]')).toBeHidden();
  });

  test('el header mobile no muestra el acceso al perfil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo mobile');

    await page.goto('/account');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="profile-button"]')).toBeHidden();
    await expect(page.locator('[data-testid="bottom-profile-link"]')).toBeVisible();
  });
});
