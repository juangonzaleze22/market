import { test, expect } from '@playwright/test';

test.describe('Carrito de Compras', () => {
  test('agregar producto al carrito', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1', { timeout: 10000 });
  });

  test('ver carrito con items', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Carrito")')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
  });

  test('agregar al carrito no abre el drawer y muestra notificación', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="add-to-cart"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-drawer"]')).not.toHaveClass(/open/);
  });

  test('muestra la animación de producto volando al carrito', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="add-to-cart"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });

    await expect(page.locator('[data-testid="fly-to-cart-ghost"]')).toBeAttached({ timeout: 2000 });
  });

  test('el botón + no permite superar el stock disponible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="add-to-cart"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });

    await page.goto('/cart');
    const item = page.locator('[data-testid="cart-item"]').first();
    await expect(item).toBeVisible();

    const stockLabel = item.locator('[data-testid="cart-item-stock"]');
    await expect(stockLabel).toBeVisible();

    const match = (await stockLabel.innerText()).match(/de (\d+)/);
    const stock = match ? Number(match[1]) : 0;
    expect(stock).toBeGreaterThan(0);

    const inc = item.locator('[data-testid="qty-inc"]');
    for (let qty = 1; qty < stock; qty++) {
      await inc.click();
    }

    await expect(item.locator('[data-testid="cart-item-qty"]')).toHaveText(String(stock));
    await expect(inc).toBeDisabled();
    await expect(stockLabel).toContainText(`Máximo disponible: ${stock}`);
  });

  test('bloquea el pago cuando la cantidad supera el stock real', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="add-to-cart"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });

    await page.evaluate(() => {
      const raw = localStorage.getItem('market_cart');
      if (!raw) return;
      const items = JSON.parse(raw);
      items[0].quantity = 999;
      localStorage.setItem('market_cart', JSON.stringify(items));
    });

    await page.goto('/cart');
    await page.locator('[data-testid="checkout-button"]').click();

    await expect(page.locator('[data-testid="cart-stock-error"]')).toBeVisible();
    await expect(page).toHaveURL(/\/cart/);
  });
});
