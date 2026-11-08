import { test, expect, type Page } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../helpers/api';

async function openSidebarIfMobile(page: Page): Promise<void> {
  await page
    .locator('[data-testid="admin-layout"]')
    .waitFor({ state: 'visible', timeout: 15000 });
  const toggle = page.locator('[data-testid="admin-sidebar-toggle"]');
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
}

async function openFirstOrderDetail(page: Page, isMobile: boolean): Promise<boolean> {
  if (isMobile) {
    const card = page.locator('[data-testid^="order-card-"]').first();
    if ((await card.count()) === 0) return false;
    const cardId = (await card.getAttribute('data-testid')) ?? '';
    const id = cardId.replace('order-card-', '');
    await card.locator('button').first().click();
    await page.locator(`[data-testid="mobile-view-order-${id}"]`).click();
    return true;
  }

  const view = page.locator('[data-testid^="view-order-"]').first();
  if ((await view.count()) === 0) return false;
  await view.click();
  return true;
}

test.describe('Panel Administrativo', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('un admin puede acceder al panel', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
  });

  test('el dashboard muestra estadisticas', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="command-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-backlog"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-center"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
  });

  test('un customer no puede acceder al panel', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('market_token');
      localStorage.removeItem('market_user');
    });
    await loginViaModal(page, 'test@example.com', 'password');
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin', { timeout: 5000 });
  });

  test('navegacion a usuarios funciona', async ({ page }) => {
    await page.goto('/admin');
    await openSidebarIfMobile(page);
    await page.click('[data-testid="nav-users"]');
    await expect(page.locator('[data-testid="admin-users"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="users-title"]')).toContainText('Usuarios');
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });

  test('navegacion a productos funciona', async ({ page }) => {
    await page.goto('/admin');
    await openSidebarIfMobile(page);
    await page.click('[data-testid="nav-products"]');
    await expect(page.locator('[data-testid="admin-products"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="products-title"]')).toContainText('Productos');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
  });

  test('navegacion a categorias funciona', async ({ page }) => {
    await page.goto('/admin');
    await openSidebarIfMobile(page);
    await page.click('[data-testid="nav-categories"]');
    await expect(page.locator('[data-testid="admin-categories"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="categories-title"]')).toContainText('Categorías');
    await expect(page.locator('[data-testid="categories-table"]')).toBeVisible();
  });

  test('navegacion a pedidos funciona', async ({ page, isMobile }) => {
    await page.goto('/admin');
    await openSidebarIfMobile(page);
    await page.click('[data-testid="nav-orders"]');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="orders-title"]')).toContainText('Pedidos');
    if (!isMobile) {
      await expect(page.locator('[data-testid="orders-table-header"]')).toBeVisible();
    }
  });

  test('el sidebar muestra enlace a tienda', async ({ page }) => {
    await page.goto('/admin');
    await openSidebarIfMobile(page);
    await expect(page.locator('[data-testid="admin-view-store"]')).toBeVisible();
    await page.click('[data-testid="admin-view-store"]');
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});

test.describe('Productos - Modal y acciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('formulario de creacion se abre en modal', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="add-product-btn"]');

    const modal = page.locator('[data-testid="product-form-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="form-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-slug"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-image-choose"]')).toBeVisible();
  });

  test('modal de creacion se cierra con cancelar y con la X', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="add-product-btn"]');
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="cancel-form"]');
    await expect(page.locator('[data-testid="form-name"]')).not.toBeVisible({ timeout: 3000 });

    await page.click('[data-testid="add-product-btn"]');
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible({ timeout: 5000 });
    await page.click('[data-testid="product-form-modal-close"]');
    await expect(page.locator('[data-testid="form-name"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('tabla muestra toggle de activo y botones de accion icon-only', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Vista de tabla solo disponible en desktop');
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('[data-testid^="product-row-"]').first();
    await expect(firstRow).toBeVisible();

    const toggleInput = firstRow.locator('.toggle input[type="checkbox"]');
    await expect(toggleInput).toBeAttached();

    const rowId = await firstRow.getAttribute('data-testid');
    if (rowId) {
      const id = rowId.replace('product-row-', '');
      await expect(page.locator(`[data-testid="detail-product-${id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="edit-product-${id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="delete-product-${id}"]`)).toBeVisible();
    }
  });

  test('modal de detalle se abre desde el icono de ojo', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Vista de tabla solo disponible en desktop');
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('[data-testid^="product-row-"]').first();
    const rowId = (await firstRow.getAttribute('data-testid')) ?? '';
    const id = rowId.replace('product-row-', '');

    await page
      .locator(`[data-testid="detail-product-${id}"]`)
      .evaluate((el) => (el as HTMLElement).click());
    const detailModal = page.locator('[data-testid="product-detail-modal"]');
    await expect(detailModal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-sku"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-stock"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-status"]')).toBeVisible();

    await page.click('[data-testid="detail-close"]');
    await expect(page.locator('[data-testid="detail-name"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('buscar productos funciona con entrada de texto mas ancha', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible({ timeout: 10000 });
    await page.fill('[data-testid="product-search"]', 'xyz-no-existente');
    await expect(page.locator('[data-testid="products-table"]')).toContainText(
      'No se encontraron productos',
      { timeout: 5000 },
    );
  });
});

test.describe('Categorias - Modal y acciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('formulario de creacion se abre en modal con selector de imagen', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.locator('[data-testid="categories-table"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="add-category-btn"]');

    const modal = page.locator('[data-testid="category-form-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="form-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-slug"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-image-choose"]')).toBeVisible();
  });

  test('tabla muestra botones icon-only de editar y eliminar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Vista de tabla solo disponible en desktop');
    await page.goto('/admin/categories');
    await expect(page.locator('[data-testid="categories-table"]')).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('[data-testid^="category-row-"]').first();
    await expect(firstRow).toBeVisible();
    const rowId = (await firstRow.getAttribute('data-testid')) ?? '';
    const id = rowId.replace('category-row-', '');
    await expect(page.locator(`[data-testid="edit-category-${id}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="delete-category-${id}"]`)).toBeVisible();
  });
});

test.describe('Pedidos - Modal de detalle', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('detalle del pedido se abre en modal', async ({ page, isMobile }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({ timeout: 10000 });

    const opened = await openFirstOrderDetail(page, isMobile);
    if (!opened) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="detail-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-pending"]')).toBeVisible();

    await page.click('[data-testid="close-detail"]');
    await expect(page.locator('[data-testid="detail-total"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('rechazo de pago abre dialogo y exige un motivo', async ({ page, isMobile }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({ timeout: 10000 });

    await page.selectOption('[data-testid="status-filter"]', 'pending');

    const opened = await openFirstOrderDetail(page, isMobile);
    if (!opened) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible({ timeout: 5000 });

    const rejectButton = page.locator('[data-testid="reject-payment"]');
    if (!(await rejectButton.isVisible())) {
      test.skip();
      return;
    }

    await rejectButton.click();
    await expect(page.locator('[data-testid="reject-dialog"]')).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="reject-confirm"]');
    await expect(page.locator('[data-testid="reject-error"]')).toBeVisible();

    await page.click('[data-testid="reject-cancel"]');
    await expect(page.locator('[data-testid="reject-dialog"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('filtro de estado funciona', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({ timeout: 10000 });
    await page.selectOption('[data-testid="status-filter"]', 'delivered');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({ timeout: 5000 });
  });

  test('la tabla muestra el stepper del flujo con tooltip', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Vista de tabla solo disponible en desktop');
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="orders-table-header"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="orders-table-header"]')).toContainText('Flujo');

    const firstRow = page.locator('[data-testid^="order-row-"]').first();
    if ((await firstRow.count()) === 0) {
      test.skip();
      return;
    }

    const firstFlow = firstRow.locator('[data-testid^="order-flow-"]').first();
    await expect(firstFlow).toBeVisible();
    const firstStep = firstFlow.locator('.flow-icon').first();
    await firstStep.hover();
    await expect(firstFlow.locator('.flow-tip').first()).toBeVisible();
  });
});

test.describe('Usuarios - Acciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('tabla muestra botones icon-only de eliminar y selector de rol', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Vista de tabla solo disponible en desktop');
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('[data-testid^="user-row-"]').first();
    await expect(firstRow).toBeVisible();
    const rowId = (await firstRow.getAttribute('data-testid')) ?? '';
    const id = rowId.replace('user-row-', '');
    await expect(page.locator(`[data-testid="role-select-${id}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="delete-user-${id}"]`)).toBeVisible();
  });

  test('crear usuario con rol bodega desde el panel', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="create-user-button"]')).toBeVisible({
      timeout: 10000,
    });
    await page.click('[data-testid="create-user-button"]');
    await expect(page.locator('[data-testid="create-user-modal"]')).toBeVisible({
      timeout: 5000,
    });

    const email = `e2e-user-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
    await page.fill('[data-testid="create-user-firstname"]', 'E2E');
    await page.fill('[data-testid="create-user-lastname"]', 'Bodega');
    await page.fill('[data-testid="create-user-email"]', email);
    await page.fill('[data-testid="create-user-password"]', 'secret123');
    await page.selectOption('[data-testid="create-user-role"]', 'warehouse');
    await page.click('[data-testid="create-user-submit"]');

    await expect(page.locator('[data-testid="create-user-modal"]')).not.toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('[data-testid="admin-users"]')).toContainText(email, {
      timeout: 5000,
    });
  });
});

