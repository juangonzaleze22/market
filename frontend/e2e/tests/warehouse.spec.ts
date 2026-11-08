import { test, expect, APIRequestContext } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_URL,
  registerCustomer,
  WAREHOUSE_EMAIL,
  WAREHOUSE_PASSWORD,
} from '../helpers/api';

const API = API_URL;

async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  return body.token as string;
}

/**
 * Creates a fresh customer, address, cart and order, then marks it as paid.
 * Returns the created order id and number so the warehouse flow has a
 * deterministic order that is not shared with other tests.
 */
async function createPaidOrder(
  request: APIRequestContext,
): Promise<{ id: string; orderNumber: string }> {
  const customer = await registerCustomer(request);
  const token = customer.token;
  const headers = { Authorization: `Bearer ${token}` };

  const addressRes = await request.post(`${API}/addresses`, {
    headers,
    data: {
      street: 'Calle Test 123',
      city: 'Guanare',
      state: 'Portuguesa',
      zipCode: '3350',
      country: 'Venezuela',
    },
  });
  const addressId = (await addressRes.json()).id as string;

  const productsRes = await request.get(`${API}/products?inStock=true`);
  const products = (await productsRes.json()) as Array<{ id: string }>;
  const productId = products[0].id;

  await request.post(`${API}/cart`, {
    headers,
    data: { productId, quantity: 1 },
  });

  const orderRes = await request.post(`${API}/orders`, {
    headers,
    data: { shippingAddressId: addressId, paymentMethod: 'cash' },
  });
  const order = (await orderRes.json()) as { id: string; orderNumber: string };

  const adminToken = await apiLogin(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  await request.patch(`${API}/admin/orders/${order.id}/status`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { status: 'paid' },
  });

  return { id: order.id, orderNumber: order.orderNumber };
}

test.describe('Bodega - Picking y packing', () => {
  test('una bodega puede acceder al panel de pedidos', async ({ page }) => {
    await loginViaModal(page, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);
    await page.goto('/warehouse');
    await expect(
      page.locator('[data-testid="warehouse-layout"]'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('[data-testid="warehouse-orders-title"]'),
    ).toContainText('Pedidos para preparar');
  });

  test('un customer no puede acceder al panel de bodega', async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
    await page.goto('/warehouse');
    await expect(page).not.toHaveURL('/warehouse', { timeout: 5000 });
  });

  test('prepara un pedido pagado con checklist y lo marca como enviado', async ({
    page,
    request,
  }) => {
    const order = await createPaidOrder(request);

    await loginViaModal(page, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);
    await page.goto('/warehouse');
    await expect(
      page.locator('[data-testid="warehouse-orders"]'),
    ).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="warehouse-order-search"]', order.orderNumber);
    await page.waitForTimeout(500);

    await page
      .getByRole('button', { name: 'Preparar' })
      .filter({ visible: true })
      .first()
      .click();

    await expect(page.locator('[data-testid="warehouse-detail"]')).toBeVisible({
      timeout: 5000,
    });

    // Start preparation: paid -> processing
    await expect(page.locator('[data-testid="warehouse-start"]')).toBeVisible();
    await page.click('[data-testid="warehouse-start"]');
    await expect(page.locator('[data-testid="warehouse-complete"]')).toBeVisible({
      timeout: 5000,
    });

    // Check every article in the checklist
    const checks = page.locator('[data-testid^="warehouse-item-check-"]');
    const count = await checks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await checks.nth(i).check();
    }

    await expect(page.locator('[data-testid="warehouse-complete"]')).toBeEnabled({
      timeout: 5000,
    });
    await page.click('[data-testid="warehouse-complete"]');

    await expect(page.locator('[data-testid="warehouse-detail"]')).toBeHidden({
      timeout: 8000,
    });
  });

  test('muestra el nombre del cliente y filtra por fecha y artículos', async ({
    page,
    request,
  }) => {
    const order = await createPaidOrder(request);

    await loginViaModal(page, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);
    await page.goto('/warehouse');
    await expect(
      page.locator('[data-testid="warehouse-orders"]'),
    ).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="warehouse-order-search"]', order.orderNumber);
    await page.waitForTimeout(600);

    // El nombre del cliente aparece en la fila
    await expect(
      page.getByText('E2E Chat').filter({ visible: true }).first(),
    ).toBeVisible();

    // Filtro por artículos: el pedido tiene 1 artículo
    await page.fill('[data-testid="warehouse-min-items-filter"]', '1');
    await page.fill('[data-testid="warehouse-max-items-filter"]', '1');
    await page.waitForTimeout(600);
    await expect(
      page.getByText(order.orderNumber).filter({ visible: true }).first(),
    ).toBeVisible();

    await page.fill('[data-testid="warehouse-min-items-filter"]', '2');
    await page.waitForTimeout(600);
    await expect(
      page.getByText(order.orderNumber).filter({ visible: true }),
    ).toHaveCount(0);
    await page.fill('[data-testid="warehouse-min-items-filter"]', '');

    // Filtro por fecha: hoy
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(now.getDate()).padStart(2, '0')}`;
    await page.fill('[data-testid="warehouse-date-from-filter"]', today);
    await page.fill('[data-testid="warehouse-date-to-filter"]', today);
    await page.waitForTimeout(600);
    await expect(
      page.getByText(order.orderNumber).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test('el detalle de bodega no muestra la información de envío', async ({
    page,
    request,
  }) => {
    const order = await createPaidOrder(request);

    await loginViaModal(page, WAREHOUSE_EMAIL, WAREHOUSE_PASSWORD);
    await page.goto('/warehouse');
    await expect(
      page.locator('[data-testid="warehouse-orders"]'),
    ).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="warehouse-order-search"]', order.orderNumber);
    await page.waitForTimeout(600);

    await page
      .getByRole('button', { name: 'Preparar' })
      .filter({ visible: true })
      .first()
      .click();

    await expect(page.locator('[data-testid="warehouse-detail"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Dirección de envío')).toHaveCount(0);
    await expect(
      page
        .locator('[data-testid="warehouse-detail"]')
        .getByRole('heading', { name: 'Cliente' }),
    ).toBeVisible();
  });
});

