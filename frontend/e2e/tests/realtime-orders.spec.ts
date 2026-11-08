import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  createOrder,
  registerCustomer,
  startWarehousePreparation,
} from '../helpers/api';

test.describe('Estados de pedido en tiempo real (admin)', () => {
  test('la tabla de pedidos refleja el cambio de estado de bodega sin recargar', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);

    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin/orders');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({
      timeout: 15000,
    });

    await page.fill('[data-testid="order-search"]', order.orderNumber);

    const row = page
      .getByTestId(/^order-(row|card)-/)
      .filter({ hasText: order.orderNumber })
      .filter({ visible: true });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText('Pagado');

    await page.waitForTimeout(2500);

    await startWarehousePreparation(request, order.id);

    await expect(row).toContainText('En preparación', { timeout: 15000 });
  });

  test('el detalle abierto se actualiza cuando cambia el estado', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);

    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/admin/orders?order=${order.id}`);

    const detail = page.locator('[data-testid="order-detail"]');
    await expect(detail).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2500);

    await startWarehousePreparation(request, order.id);

    await expect(detail).toContainText('En preparación', { timeout: 15000 });
  });
});

