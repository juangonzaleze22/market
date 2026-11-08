import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';

test.describe('Checkout y Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
  });

  test('checkout muestra resumen del pedido con items', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });
    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-item-price"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="checkout-total"]')).toBeVisible();
  });

  test('checkout muestra formulario de dirección', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Dirección de envío' })).toBeVisible();
  });

  test('checkout muestra métodos de pago', async ({ page }) => {
    await page.goto('/checkout');
    const section = page.locator('[data-testid="payment-section"]');
    await expect(section.getByText('Pago Móvil', { exact: true })).toBeVisible();
    await expect(section.getByText('Zelle', { exact: true })).toBeVisible();
    await expect(section.getByText('Efectivo', { exact: true })).toBeVisible();
  });

  test('checkout permite adjuntar comprobante y muestra vista previa', async ({ page }) => {
    await page.goto('/checkout');
    const input = page.locator('[data-testid="receipt-upload"] input[type="file"]');
    await input.setInputFiles({
      name: 'comprobante.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await expect(page.locator('img[alt="Comprobante"]')).toBeVisible();
  });

  test('orders muestra página vacía cuando no hay pedidos', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();
  });
});
