import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/api';

test.describe('Admin - Gastos', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('muestra resumen y filtros de gastos', async ({ page }) => {
    await page.goto('/admin/expenses');
    await expect(page.locator('[data-testid="admin-expenses"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="expenses-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-operating"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-investment"]')).toBeVisible();
    await expect(page.locator('[data-testid="expenses-period-selector"]')).toBeVisible();
  });

  test('permite registrar y eliminar un gasto', async ({ page }) => {
    const suffix = Date.now();
    const description = `Gasto E2E ${suffix}`;
    const today = new Date().toISOString().slice(0, 10);

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/admin/expenses');
    await expect(page.locator('[data-testid="admin-expenses"]')).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="new-expense"]');
    await expect(page.locator('[data-testid="expense-modal"]')).toHaveClass(/open/);

    await page.fill('[data-testid="expense-date"]', today);
    await page.fill('[data-testid="expense-amount"]', '321.50');
    await page.fill('[data-testid="expense-description"]', description);
    await page.click('[data-testid="save-expense"]');

    const row = page.locator('[data-testid^="expense-row-"]').filter({ hasText: description });
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('$321.50');

    await row.locator('[data-testid^="delete-expense-"]').click();
    await expect(row).toHaveCount(0, { timeout: 10000 });
  });

  test('permite crear y eliminar un gasto recurrente', async ({ page }) => {
    const suffix = Date.now();
    const description = `Recurrente E2E ${suffix}`;
    const future = new Date();
    future.setDate(future.getDate() + 60);
    const startDate = future.toISOString().slice(0, 10);

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/admin/expenses');
    await expect(page.locator('[data-testid="admin-expenses"]')).toBeVisible({ timeout: 10000 });

    await page.click('[data-testid="tab-recurring"]');
    await page.click('[data-testid="new-recurring"]');
    await expect(page.locator('[data-testid="recurring-modal"]')).toHaveClass(/open/);

    await page.fill('[data-testid="recurring-description"]', description);
    await page.fill('[data-testid="recurring-amount"]', '100');
    await page.fill('[data-testid="recurring-day"]', '1');
    await page.fill('[data-testid="recurring-start"]', startDate);
    await page.click('[data-testid="save-recurring"]');

    const row = page.locator('[data-testid^="recurring-row-"]').filter({ hasText: description });
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.locator('[data-testid^="delete-recurring-"]').click();
    await expect(row).toHaveCount(0, { timeout: 10000 });
  });
});

