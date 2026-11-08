import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/api';

test.describe('Dashboard - Operación', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('abre en la vista Operación con banda de mando y acción', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-backlog"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-center"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-operations"]')).toHaveClass(/bg-ink/);
  });

  test('muestra panel de pedidos, resumen de inventario y tabla de riesgo', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="orders-panel"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="chart-orders-day"] canvas')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-units"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-risk"]')).toBeVisible();
  });

  test('muestra pedidos recientes y navega a pedidos', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="view-all-orders"]');
    await expect(page).toHaveURL(/\/admin\/orders/, { timeout: 5000 });
  });

  test('los ingresos se muestran con formato de moneda', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="command-revenue"]')).toBeVisible({ timeout: 10000 });
    const revenue = await page.locator('[data-testid="command-revenue"]').textContent();
    expect(revenue).toMatch(/\$/);
  });

  test('la tasa de cancelación se muestra como porcentaje', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="command-cancellation"]')).toBeVisible({
      timeout: 10000,
    });
    const cancellation = await page
      .locator('[data-testid="command-cancellation"]')
      .textContent();
    expect(cancellation).toContain('%');
  });
});

test.describe('Dashboard - Cambio de período y vista', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('permite cambiar el período y recarga los datos', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="period-selector"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="period-today"]');
    await expect(page.locator('[data-testid="period-today"]')).toHaveClass(/bg-ink/);
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible({ timeout: 10000 });
  });

  test('cambia a la vista Ventas y muestra sus paneles', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="view-sales"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="view-sales"]');
    await expect(page.locator('[data-testid="view-sales"]')).toHaveClass(/bg-ink/);
    await expect(page.locator('[data-testid="chart-revenue-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-category"]')).toBeVisible();
  });

  test('vuelve a Operación desde la vista Ventas', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="view-sales"]');
    await expect(page.locator('[data-testid="chart-revenue-cost"]')).toBeVisible({
      timeout: 10000,
    });
    await page.click('[data-testid="view-operations"]');
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-revenue-cost"]')).toBeHidden();
  });
});

test.describe('Dashboard - Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('operación es visible en mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-center"]')).toBeVisible();
  });
});
