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
  }, testInfo) => {
    await page.goto('/orders');
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.locator('button').first().click();

    const timeline = card.locator('[data-testid="order-timeline"]');
    await expect(timeline).toBeVisible();
    await expect(card.locator('[data-testid="timeline-step-pending"]')).toBeVisible();
    await expect(card.locator('[data-testid="timeline-desc-pending"]')).toHaveText(
      'Recibimos tu pedido',
    );
    await expect(card.locator('[data-testid="timeline-time-pending"]')).toHaveText(
      /\d{2}:\d{2}/,
    );
    await expect(card.locator('[data-testid="timeline-desc-delivered"]')).toHaveText(
      'Tu pedido fue entregado',
    );

    const listDirection = await timeline
      .locator('.otl-list')
      .evaluate((element) => getComputedStyle(element).flexDirection);
    expect(listDirection).toBe(
      testInfo.project.name === 'Mobile Chrome' ? 'column' : 'row',
    );

    const status = card.locator('[data-testid="order-status"]');
    await expect(status).toContainText('Pendiente');

    await acceptOrder(request, order.id);

    await expect(status).toContainText('Pagado', { timeout: 15000 });
    await expect(card.locator('[data-testid="timeline-step-paid"]')).toHaveClass(/active/);
    await expect(card.locator('[data-testid="timeline-time-paid"]')).toHaveText(
      /\d{2}:\d{2}/,
    );
    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
  });
});
