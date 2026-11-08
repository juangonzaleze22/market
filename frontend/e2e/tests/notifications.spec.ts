import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  createOrder,
  registerCustomer,
  sendAdminMessage,
} from '../helpers/api';

test.describe('Notificaciones de nuevos pedidos', () => {
  test('el badge de pedidos aparece con un pedido nuevo y se limpia al abrirlos', async ({
    page,
    request,
  }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible({
      timeout: 15000,
    });

    // Esperar a que el socket del admin se conecte antes de generar el pedido.
    await page.waitForTimeout(2500);

    const customer = await registerCustomer(request);
    await createOrder(request, customer);

    await expect(page.locator('[data-testid="nav-orders-badge"]')).toBeVisible({
      timeout: 15000,
    });

    const sidebarToggle = page.locator('[data-testid="admin-sidebar-toggle"]');
    if (await sidebarToggle.isVisible().catch(() => false)) {
      await sidebarToggle.click();
    }
    await page.click('[data-testid="nav-orders"]');
    await expect(page.locator('[data-testid="admin-orders"]')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[data-testid="nav-orders-badge"]')).toHaveCount(0);
  });

  test('al hacer click en una notificación abre el pedido del admin', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);

    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible({
      timeout: 15000,
    });

    await page.click('[data-testid="admin-notifications-button"]');
    const item = page.locator('[data-testid="admin-notifications-dropdown"] button', {
      hasText: order.orderNumber,
    });
    await expect(item.first()).toBeVisible({ timeout: 15000 });
    await item.first().click();

    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.locator('[data-testid="order-detail-modal"]')).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe('Notificaciones del cliente', () => {
  test('una actualización de estado se ve en el apartado y abre el pedido con chat', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);

    await loginViaModal(page, customer.email, customer.password);
    await page.goto('/account/notifications');

    await expect(page.locator('[data-testid="notifications-page"]')).toBeVisible({
      timeout: 15000,
    });

    const item = page.locator('[data-testid="notification-item"]', {
      hasText: order.orderNumber,
    });
    await expect(item).toBeVisible({ timeout: 15000 });
    await item.click();

    await expect(page).toHaveURL(new RegExp(`/orders\\?order=${order.id}`));

    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
  });

  test('la respuesta de la tienda en el chat notifica y lleva al pedido', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);
    await sendAdminMessage(request, order.id, 'Respuesta de prueba E2E');

    await loginViaModal(page, customer.email, customer.password);
    await page.goto('/account/notifications');

    const item = page.locator('[data-testid="notification-item"]', {
      hasText: 'Respuesta de la tienda',
    });
    await expect(item).toBeVisible({ timeout: 15000 });
    await item.click();

    await expect(page).toHaveURL(new RegExp(`/orders\\?order=${order.id}`));
    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card.locator('[data-testid="chat-panel"]')).toBeVisible();
    await expect(
      card.locator('[data-testid="chat-message"]', {
        hasText: 'Respuesta de prueba E2E',
      }),
    ).toBeVisible();
  });
});

