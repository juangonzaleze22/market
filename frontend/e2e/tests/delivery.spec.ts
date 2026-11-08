import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  acceptOrder,
  createOrder,
  DELIVERY_EMAIL,
  DELIVERY_PASSWORD,
  deliveryAccept,
  deliverySetLocation,
  registerCustomer,
  shipOrder,
} from '../helpers/api';

async function createReadyOrder(
  request: Parameters<typeof registerCustomer>[0],
): Promise<{ orderNumber: string; id: string }> {
  const customer = await registerCustomer(request);
  const order = await createOrder(request, customer);
  await acceptOrder(request, order.id);
  await shipOrder(request, order.id);
  return order;
}

test.describe('Delivery - entregas y seguimiento', () => {
  test('el delivery acepta un pedido listo y lo marca entregado', async ({
    page,
    request,
  }) => {
    const order = await createReadyOrder(request);

    await loginViaModal(page, DELIVERY_EMAIL, DELIVERY_PASSWORD);
    await expect(page).toHaveURL(/\/delivery$/, { timeout: 10000 });

    await page.fill('[data-testid="delivery-order-search"]', order.orderNumber);
    await page.waitForTimeout(500);

    const card = page.locator(`[data-testid="delivery-order-${order.id}"]`);
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card).toContainText('productos');

    await page.click(`[data-testid="delivery-accept-${order.id}"]`);

    await expect(page.locator('[data-testid="delivery-detail"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="delivery-complete"]')).toBeVisible();

    await page.click('[data-testid="delivery-complete"]');
    await expect(page.locator('[data-testid="delivery-detail"]')).toBeHidden({
      timeout: 10000,
    });
  });

  test('el delivery ve el detalle de un pedido disponible antes de aceptarlo', async ({
    page,
    request,
  }) => {
    const order = await createReadyOrder(request);

    await loginViaModal(page, DELIVERY_EMAIL, DELIVERY_PASSWORD);
    await expect(page).toHaveURL(/\/delivery$/, { timeout: 10000 });

    await page.fill('[data-testid="delivery-order-search"]', order.orderNumber);
    await page.waitForTimeout(500);

    await expect(
      page.locator(`[data-testid="delivery-view-${order.id}"]`),
    ).toBeVisible({ timeout: 15000 });
    await page.click(`[data-testid="delivery-view-${order.id}"]`);

    await expect(page.locator('[data-testid="delivery-detail"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="delivery-complete"]')).toHaveCount(0);

    await page.click('[data-testid="delivery-detail-close"]');
    await expect(page.locator('[data-testid="delivery-detail"]')).toBeHidden({
      timeout: 10000,
    });

    await expect(
      page.locator(`[data-testid="delivery-accept-${order.id}"]`),
    ).toBeVisible();
  });

  test('el cliente ve el mapa de seguimiento con el repartidor', async ({
    page,
    request,
  }) => {
    const customer = await registerCustomer(request);
    const order = await createOrder(request, customer);
    await acceptOrder(request, order.id);
    await shipOrder(request, order.id);
    await deliveryAccept(request, order.id);
    await deliverySetLocation(request, order.id, 9.05, -69.75);

    await page.route('**/router.project-osrm.org/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          routes: [
            {
              geometry: {
                coordinates: [
                  [-69.75, 9.05],
                  [-69.7423, 9.0422],
                ],
              },
            },
          ],
        }),
      }),
    );

    await loginViaModal(page, customer.email, customer.password);
    await page.goto('/orders');

    const card = page.locator('[data-testid="order-card"]', {
      hasText: order.orderNumber,
    });
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.locator('button').first().click();

    await expect(card.locator('[data-testid="order-tracking"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(card.locator('[data-testid="delivery-map"]')).toBeVisible();
    await expect(card.locator('[data-testid="order-delivery-name"]')).toContainText(
      'Delivery',
    );
  });

  test('el delivery comparte su ubicación (GPS) y se envía al backend', async ({
    browser,
    request,
  }) => {
    const order = await createReadyOrder(request);
    await deliveryAccept(request, order.id);

    const context = await browser.newContext({
      geolocation: { latitude: 9.06, longitude: -69.76 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();

    await loginViaModal(page, DELIVERY_EMAIL, DELIVERY_PASSWORD);
    await page.goto('/delivery');
    await page.click('[data-testid="delivery-scope-mine"]');
    await page.fill('[data-testid="delivery-order-search"]', order.orderNumber);
    await page.waitForTimeout(500);
    await page.click(`[data-testid="delivery-view-${order.id}"]`);

    await expect(page.locator('[data-testid="delivery-detail"]')).toBeVisible({
      timeout: 10000,
    });

    const locationRequest = page.waitForRequest(
      (req) =>
        req.url().includes(`/delivery/orders/${order.id}/location`) &&
        req.method() === 'PATCH',
      { timeout: 15000 },
    );
    await page.click('[data-testid="delivery-share-toggle"]');
    await locationRequest;

    await expect(page.locator('[data-testid="delivery-geo-error"]')).toHaveCount(0);
    await context.close();
  });

  test('el delivery puede chatear en el pedido asignado', async ({
    page,
    request,
  }) => {
    const order = await createReadyOrder(request);
    await deliveryAccept(request, order.id);

    await loginViaModal(page, DELIVERY_EMAIL, DELIVERY_PASSWORD);
    await page.goto('/delivery');
    await page.click('[data-testid="delivery-scope-mine"]');
    await page.fill('[data-testid="delivery-order-search"]', order.orderNumber);
    await page.waitForTimeout(500);
    await page.click(`[data-testid="delivery-view-${order.id}"]`);

    await expect(page.locator('[data-testid="delivery-detail"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('Voy en camino');
    await input.press('Enter');

    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText(
      'Voy en camino',
    );
  });
});

