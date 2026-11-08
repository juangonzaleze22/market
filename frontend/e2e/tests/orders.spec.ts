import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  createOrder,
  registerCustomer,
  type CreatedOrder,
  type Credentials,
} from '../helpers/api';

test.describe('Estado del pedido en tiempo real', () => {
  let customer: Credentials;
  let order: CreatedOrder;

  test.beforeAll(async ({ request }) => {
    customer = await registerCustomer(request);
    order = await createOrder(request, customer);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, customer.email, customer.password);
  });

  test('el timeline se actualiza sin recargar cuando el admin acepta el pedido', async ({
    page,
    request,
  }) => {
    await page.goto('/orders');
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.locator('button').first().click();

    const status = card.locator('[data-testid="order-status"]');
    await expect(status).toContainText('Pendiente');

    await acceptOrder(request, order.id);

    await expect(status).toContainText('Pagado', { timeout: 15000 });
    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
  });
});
