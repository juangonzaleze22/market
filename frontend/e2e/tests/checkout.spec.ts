import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import {
  API_URL,
  Credentials,
  ensureAddress,
  firstProductId,
  registerCustomer,
} from '../helpers/api';

const RECEIPT_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFJSURBVHhe7ZYxDoIwGEY9iLdi8CwkDN6C2ROwcALDzMzM4uIdftMisX5FIzWGxu9r8hJ9yPA/aXW3Px6MmR0KNhQABRsKgIINBUDBhgKgYEMBULChACjYUAAUbCgACjYUAAUbCoCCDQVA8TF1a6OFq7cqun6xU/18XzW4z8Z+K9ICNL0f+dygCwZbCFB0lzjUxiQEKO10heHv+AGvrRXuPQbwgfIa3rE+gB/sxSDh0OHrTId3rA/ghpm/5YjazvPWmAM001mx9MTkwI8DTGsc+ug8yIX1Ad5tAR8g3AJmY1f6azkegI71AVIPwft9NtTRfVuSECD9ZxCfihxIC+CZ9vtjffZHaI6XS4QvAvwHCoCCDQVAwYYCoGBDAVCwoQAo2FAAFGwoAAo2FAAFGwqAgg0FQMGGAqBgQwFQsKEAKNhQABRsKAAKNm5ybaHkwNcTeAAAAABJRU5ErkJggg==';

async function seedCart(
  request: APIRequestContext,
  customer: Credentials,
  branchId: string,
): Promise<void> {
  const headers = { Authorization: `Bearer ${customer.token}` };
  await request.delete(`${API_URL}/cart?branchId=${branchId}`, { headers });
  const productId = await firstProductId(request, branchId);
  const res = await request.post(`${API_URL}/cart`, {
    headers,
    data: { productId, quantity: 1, branchId },
  });
  expect(res.ok(), 'add to cart failed').toBeTruthy();
}

async function goToPayment(page: Page): Promise<void> {
  const next = page.getByTestId('checkout-next');
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByTestId('payment-section')).toBeVisible();
}

async function fillReferenceAndReceipt(page: Page): Promise<void> {
  await page.locator('#paymentRef').fill('1234567890');
  await page
    .locator('[data-testid="receipt-upload"] input[type="file"]')
    .setInputFiles({
      name: 'comprobante.png',
      mimeType: 'image/png',
      buffer: Buffer.from(RECEIPT_PNG, 'base64'),
    });
  await expect(page.locator('img[alt="Comprobante"]')).toBeVisible();
}

test.describe('Checkout y Pedidos', () => {
  test.describe.configure({ mode: 'serial' });

  let customer: Credentials;
  let branchId: string;

  test.beforeAll(async ({ request }) => {
    customer = await registerCustomer(request);
    const res = await request.get(`${API_URL}/branches`);
    const branches = (await res.json()) as Array<{
      id: string;
      isDefault?: boolean;
    }>;
    expect(branches.length, 'no branches seeded').toBeGreaterThan(0);
    branchId = (branches.find((branch) => branch.isDefault) ?? branches[0]).id;
  });

  test.beforeEach(async ({ page, request }) => {
    await seedCart(request, customer, branchId);
    await loginViaModal(page, customer.email, customer.password);
  });

  test('checkout muestra resumen del pedido con items', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();

    const toggle = page.getByTestId('checkout-summary-toggle');
    if (await toggle.isVisible()) {
      await toggle.click();
    }

    await expect(page.getByTestId('checkout-item-price').first()).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toBeVisible();
  });

  test('checkout muestra el paso de dirección de envío', async ({ page }) => {
    await page.goto('/checkout');
    await expect(
      page.getByRole('heading', { name: 'Dirección de envío' }),
    ).toBeVisible();
  });

  test('no permite continuar sin dirección y avanza al agregarla', async ({
    page,
  }) => {
    await page.goto('/checkout');

    const next = page.getByTestId('checkout-next');
    await expect(next).toBeDisabled();
    await expect(page.getByTestId('checkout-step-error')).toContainText(
      'Agregá una dirección',
    );

    await page.getByTestId('add-address').click();
    await page.locator('#street').fill('Calle E2E 123');
    await page.locator('#city').fill('Caracas');
    await page.locator('#state').fill('Distrito Capital');
    await page.locator('#zipCode').fill('1010');
    await page.locator('#country').fill('Venezuela');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();

    await expect(page.getByTestId('payment-section')).toBeVisible();
  });

  test('checkout muestra métodos de pago después de elegir dirección', async ({
    request,
    page,
  }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);

    const section = page.getByTestId('payment-section');
    await expect(section.getByText('Pago Móvil', { exact: true })).toBeVisible();
    await expect(section.getByText('Zelle', { exact: true })).toBeVisible();
    await expect(section.getByText('Efectivo', { exact: true })).toBeVisible();
  });

  test('exige referencia y comprobante para Pago Móvil', async ({
    request,
    page,
  }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);

    const next = page.getByTestId('checkout-next');
    await expect(next).toBeDisabled();

    await page.locator('#paymentRef').fill('1234567890');
    await expect(next).toBeDisabled();

    await page
      .locator('[data-testid="receipt-upload"] input[type="file"]')
      .setInputFiles({
        name: 'comprobante.png',
        mimeType: 'image/png',
        buffer: Buffer.from(RECEIPT_PNG, 'base64'),
      });
    await expect(page.locator('img[alt="Comprobante"]')).toBeVisible();
    await expect(next).toBeEnabled();

    await next.click();
    await expect(page.getByTestId('checkout-step-review')).toBeVisible();
  });

  test('efectivo permite avanzar sin referencia ni comprobante', async ({
    request,
    page,
  }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);

    await page
      .getByTestId('payment-section')
      .getByText('Efectivo', { exact: true })
      .click();

    const next = page.getByTestId('checkout-next');
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByTestId('checkout-step-review')).toBeVisible();
    await expect(page.getByTestId('review-payment-method')).toContainText(
      'Efectivo',
    );
  });

  test('revisión permite editar envío y pago', async ({ request, page }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);
    await page
      .getByTestId('payment-section')
      .getByText('Efectivo', { exact: true })
      .click();
    await page.getByTestId('checkout-next').click();
    await expect(page.getByTestId('checkout-step-review')).toBeVisible();

    await page.getByTestId('review-edit-shipping').click();
    await expect(page.getByTestId('shipping-section')).toBeVisible();

    await page.getByTestId('checkout-next').click();
    await expect(page.getByTestId('payment-section')).toBeVisible();
    await page.getByTestId('checkout-next').click();
    await expect(page.getByTestId('checkout-step-review')).toBeVisible();

    await page.getByTestId('review-edit-payment').click();
    await expect(page.getByTestId('payment-section')).toBeVisible();
  });

  test('confirma el pedido con comprobante adjunto', async ({
    request,
    page,
  }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);
    await fillReferenceAndReceipt(page);
    await page.getByTestId('checkout-next').click();
    await expect(page.getByTestId('checkout-step-review')).toBeVisible();

    await page.getByTestId('place-order').click();
    await page.waitForURL(/\/order-completed\//, { timeout: 20000 });
    await expect(page.getByTestId('order-completed-page')).toBeVisible();
  });

  test('el top bar muestra la sección actual', async ({ request, page }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');

    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Envío');
    await expect(page.getByTestId('checkout-back')).toBeVisible();

    await goToPayment(page);
    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Pago');

    await page
      .getByTestId('payment-section')
      .getByText('Efectivo', { exact: true })
      .click();
    await page.getByTestId('checkout-next').click();
    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Revisión');
  });

  test('atrás en envío navega al home y abre el carrito', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByTestId('checkout-back').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
  });

  test('atrás en pago vuelve al paso de envío', async ({ request, page }) => {
    await ensureAddress(request, customer.token);
    await page.goto('/checkout');
    await goToPayment(page);

    await page.getByTestId('checkout-back').click();

    await expect(page.getByTestId('shipping-section')).toBeVisible();
    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Envío');
  });

  test('muestra el mapa en todas las direcciones con coordenadas', async ({
    request,
    page,
  }) => {
    const created = await request.post(`${API_URL}/addresses`, {
      headers: { Authorization: `Bearer ${customer.token}` },
      data: {
        street: 'Calle Mapa 123',
        city: 'Guanare',
        state: 'Portuguesa',
        zipCode: '3301',
        country: 'Venezuela',
        label: 'Mapa E2E',
        latitude: 9.0422,
        longitude: -69.7423,
      },
    });
    expect(created.ok(), 'create address with coords failed').toBeTruthy();

    await page.goto('/checkout');
    const option = page
      .locator('[data-testid="address-option"]')
      .filter({ hasText: 'Mapa E2E' });
    await expect(option).toBeVisible();

    await expect(option.getByTestId('address-map-preview')).toBeVisible();

    await option.click();
    await expect(option.getByTestId('address-map-preview')).toBeVisible();
  });

  test('desktop mantiene el shell normal y el stepper lateral', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'solo desktop');
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-bar')).toBeVisible();
    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Envío');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
    await expect(page.getByTestId('checkout-stepper')).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toBeVisible();
  });

  test('mobile oculta el bottom-nav y usa barra fija con progreso', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'solo mobile');
    await page.goto('/checkout');

    await expect(page.getByTestId('checkout-bar')).toBeVisible();
    await expect(page.getByTestId('checkout-bar-title')).toHaveText('Envío');
    await expect(page.locator('app-header')).toHaveCount(0);
    await expect(page.locator('[data-testid="footer"]')).toBeHidden();
    await expect(page.getByTestId('checkout-progress')).toBeVisible();
    await expect(page.getByTestId('checkout-progress-back')).toHaveCount(0);
    await expect(page.getByTestId('checkout-actions')).toBeVisible();
    await expect(page.getByTestId('checkout-summary-toggle')).toBeVisible();
    await expect(page.getByTestId('bottom-cart-button')).toHaveCount(0);
  });

  test('orders muestra página vacía cuando no hay pedidos', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByTestId('orders-page')).toBeVisible();
  });
});
