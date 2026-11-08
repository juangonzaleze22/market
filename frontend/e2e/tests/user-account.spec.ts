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

  test('muestra link Mi Cuenta en el dropdown del perfil', async ({ page }) => {
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
