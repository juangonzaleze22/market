import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  createOrder,
  deliverOrder,
  registerCustomer,
  type CreatedOrder,
  type Credentials,
} from '../helpers/api';

test.describe('Chat del pedido', () => {
  let customer: Credentials;
  let order: CreatedOrder;

  test.beforeAll(async ({ request }) => {
    customer = await registerCustomer(request);
    order = await createOrder(request, customer);
    await acceptOrder(request, order.id);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, customer.email, customer.password);
  });

  test('un pedido aceptado muestra el chat con el mensaje automático', async ({
    page,
  }) => {
    await page.goto('/orders');
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.locator('button').first().click();

    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
    await expect(
      card.locator('[data-testid="chat-message-system"]'),
    ).toContainText('picking & packing');
  });

  test('el cliente puede enviar un mensaje en el chat', async ({ page }) => {
    await page.goto('/orders');
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.locator('button').first().click();
    const input = card.locator('[data-testid="chat-input"]');
    await input.fill('Hola, agreguen una nota');
    await input.press('Enter');

    await expect(card.locator('[data-testid="chat-message"]').last()).toContainText(
      'Hola, agreguen una nota',
    );
  });
});

test.describe('Chat cerrado al entregar', () => {
  let customer: Credentials;
  let order: CreatedOrder;

  test.beforeAll(async ({ request }) => {
    customer = await registerCustomer(request);
    order = await createOrder(request, customer);
    await acceptOrder(request, order.id);
    await deliverOrder(request, order.id);
  });

  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, customer.email, customer.password);
  });

  test('un pedido entregado cierra el chat y no permite escribir', async ({
    page,
  }) => {
    await page.goto('/orders');
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });

    await card.locator('button').first().click();

    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
    await expect(card.locator('[data-testid="chat-closed"]')).toContainText(
      'El chat está cerrado',
    );
    await expect(card.locator('[data-testid="chat-input"]')).toHaveCount(0);
    await expect(card.locator('[data-testid="chat-send"]')).toHaveCount(0);
  });
});
