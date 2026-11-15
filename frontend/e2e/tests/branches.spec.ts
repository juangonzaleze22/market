import { test, expect, Page } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  API_URL,
  adminToken,
  defaultBranchId,
  firstProductId,
  registerCustomer,
} from '../helpers/api';

async function selectBranch(page: Page, branchId: string): Promise<void> {
  const headerTrigger = page.locator('[data-testid="header-address-button"]');
  const fabTrigger = page.locator('[data-testid="branch-switcher-button"]');
  const trigger = (await headerTrigger.isVisible()) ? headerTrigger : fabTrigger;
  await trigger.click();
  await expect(page.locator('[data-testid="branch-switcher"]')).toBeVisible();
  await page.locator(`[data-testid="branch-option-${branchId}"]`).click();
  await expect(page.locator('[data-testid="branch-switcher"]')).toBeHidden();
}

test.describe('Sucursales', () => {
  test('el botón flotante permite elegir una sucursal', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="header"]').waitFor({ state: 'visible' });
    const headerTrigger = page.locator('[data-testid="header-address-button"]');
    const fabTrigger = page.locator('[data-testid="branch-switcher-button"]');
    const trigger = (await headerTrigger.isVisible()) ? headerTrigger : fabTrigger;
    await trigger.click();
    const modal = page.locator('[data-testid="branch-switcher"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(
      modal.locator('[data-testid^="branch-option-"]').first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="branch-use-location"]'),
    ).toBeVisible();
  });

  test('el admin puede crear y eliminar una sucursal', async ({ page }) => {
    await loginViaModal(page, 'admin@example.com', 'admin123');
    await page.goto('/admin/branches');
    await expect(page.locator('[data-testid="admin-branches"]')).toBeVisible({
      timeout: 10000,
    });

    const name = `E2E Sucursal ${Date.now()}`;
    await page.click('[data-testid="new-branch"]');
    await expect(page.locator('[data-testid="branch-form"]')).toBeVisible();

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="slug"]', `e2e-${Date.now()}`);
    await page.fill('input[name="city"]', 'Guanare');
    await page.fill('input[name="state"]', 'Portuguesa');
    await page.click('[data-testid="branch-form"] button[type="submit"]');

    const card = page.locator('[data-testid="branch-list"] button', {
      hasText: name,
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.click();
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar' }).first().click();

    await expect(card).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe('Carrito por sucursal', () => {
  let admin: string;
  let defaultId: string;
  let emptyBranchId: string;

  test.beforeAll(async ({ request }) => {
    admin = await adminToken(request);
    defaultId = await defaultBranchId(request);

    const res = await request.post(`${API_URL}/admin/branches`, {
      headers: { Authorization: `Bearer ${admin}` },
      data: {
        name: `E2E Vacía ${Date.now()}`,
        slug: `e2e-vacia-${Date.now()}`,
        city: 'Guanare',
        state: 'Portuguesa',
        latitude: 9.05,
        longitude: -69.75,
        isActive: true,
      },
    });
    expect(res.ok(), 'create empty branch failed').toBeTruthy();
    emptyBranchId = (await res.json()).id as string;
  });

  test.afterAll(async ({ request }) => {
    if (!emptyBranchId) return;
    await request.delete(`${API_URL}/admin/branches/${emptyBranchId}`, {
      headers: { Authorization: `Bearer ${admin}` },
    });
  });

  test('al cambiar de sucursal muestra el carrito de esa sucursal', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');

    await selectBranch(page, defaultId);
    await page.evaluate(() => {
      const btn = document.querySelector(
        '[data-testid="add-to-cart"]',
      ) as HTMLElement | null;
      btn?.click();
    });
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    await selectBranch(page, emptyBranchId);
    await expect(page.locator('[data-testid="cart-count"]')).toHaveCount(0);

    await selectBranch(page, defaultId);
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('un usuario autenticado ve solo el carrito de la sucursal activa', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const productId = await firstProductId(request, defaultId);
    const headers = { Authorization: `Bearer ${customer.token}` };

    await request.delete(`${API_URL}/cart?branchId=${defaultId}`, { headers });
    const added = await request.post(`${API_URL}/cart`, {
      headers,
      data: { productId, quantity: 1, branchId: defaultId },
    });
    expect(added.ok(), 'add to default branch cart failed').toBeTruthy();

    await loginViaModal(page, customer.email, customer.password);
    await selectBranch(page, defaultId);
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    await selectBranch(page, emptyBranchId);
    await expect(page.locator('[data-testid="cart-count"]')).toHaveCount(0);

    await selectBranch(page, defaultId);
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });
});
