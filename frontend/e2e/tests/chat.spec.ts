import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
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

  test('el widget flotante lista los chats y abre la conversación del pedido', async ({
    page,
  }) => {
    await page.goto('/orders');
    const isMobile = (page.viewportSize()?.width ?? 0) < 768;

    if (isMobile) {
      await page.getByTestId('bottom-chat-link').click();
      await expect(page).toHaveURL(/\/messages/);
      await expect(page.getByTestId('messages-page')).toBeVisible();
    } else {
      await page.getByTestId('chat-widget-toggle').click();
    }

    const conversation = page
      .getByTestId('chat-widget-conversation')
      .filter({ hasText: order.orderNumber });
    await expect(conversation).toBeVisible({ timeout: 15000 });

    await conversation.click();

    const panel = page.getByTestId('chat-widget-panel');
    await expect(panel.getByTestId('chat-widget-order')).toContainText(
      order.orderNumber,
    );
    await expect(panel.getByTestId('chat-panel')).toBeVisible();

    if (!isMobile) {
      await panel.getByTestId('chat-widget-close').click();
      await expect(panel).toHaveCount(0);
    }
  });
});

test.describe('Widget de chat del admin', () => {
  let customer: Credentials;
  let order: CreatedOrder;

  test.beforeAll(async ({ request }) => {
    customer = await registerCustomer(request);
    order = await createOrder(request, customer);
    await acceptOrder(request, order.id);
  });

  test('el admin ve y abre la conversación del pedido desde el widget', async ({
    page,
  }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');

    const toggle = page.getByTestId('chat-widget-toggle');
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await toggle.click();
    const panel = page.getByTestId('chat-widget-panel');
    await expect(panel)
      .toBeVisible({ timeout: 3000 })
      .catch(async () => {
        await toggle.click();
        await expect(panel).toBeVisible();
      });

    const conversation = page
      .getByTestId('chat-widget-conversation')
      .filter({ hasText: order.orderNumber });
    await expect(conversation).toBeVisible({ timeout: 15000 });

    await conversation.click();
    await expect(panel.getByTestId('chat-widget-order')).toContainText(
      order.orderNumber,
    );
    await expect(panel.getByTestId('chat-panel')).toBeVisible();
  });

  test('el admin abre el chat desde la tabla de pedidos', async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin/orders');

    const isMobile = (page.viewportSize()?.width ?? 0) < 768;
    if (isMobile) {
      const card = page.getByTestId('order-card-' + order.id);
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.getByTestId('order-actions-' + order.id).click();
      await page.getByTestId('mobile-open-chat-' + order.id).click();
    } else {
      const row = page.getByTestId('order-row-' + order.id);
      await expect(row).toBeVisible({ timeout: 15000 });
      await row.getByTestId('open-chat-' + order.id).click();
    }

    const panel = page.getByTestId('chat-widget-panel');
    await expect(panel.getByTestId('chat-widget-order')).toContainText(
      order.orderNumber,
    );
    await expect(panel.getByTestId('chat-panel')).toBeVisible();
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
