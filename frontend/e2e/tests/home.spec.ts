import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('renderiza banner y productos populares', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('[data-testid="banner-carousel"], [data-testid="banner-single"]').first(),
    ).toBeVisible();
    await expect(page.locator('[data-testid="popular-product-grid"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="popular-product-grid"] [data-testid="product-card"]').first(),
    ).toBeVisible();
  });

  test('muestra el carrusel de recomendaciones', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="recommendations-carousel"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="recommendations-carousel"] [data-testid="product-card"]').first(),
    ).toBeVisible();
  });

  test('el carrusel de recomendaciones no muestra productos sin stock', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator(
      '[data-testid="recommendations-carousel"] [data-testid="product-card"]',
    );
    await expect(cards.first()).toBeVisible();
    await expect(cards.filter({ hasText: 'Sin stock' })).toHaveCount(0);
    await expect(
      page.locator(
        '[data-testid="recommendations-carousel"] [data-testid="product-card"].is-out-of-stock',
      ),
    ).toHaveCount(0);
  });

  test('los productos populares no muestran productos sin stock', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator(
      '[data-testid="popular-product-grid"] [data-testid="product-card"]',
    );
    await expect(cards.first()).toBeVisible();
    await expect(cards.filter({ hasText: 'Sin stock' })).toHaveCount(0);
    await expect(
      page.locator('[data-testid="popular-product-grid"] .is-out-of-stock'),
    ).toHaveCount(0);
  });

  test('muestra novedades y beneficios', async ({ page }) => {
    await page.goto('/');

    const newArrivals = page.locator(
      '[data-testid="new-arrivals-carousel"] [data-testid="product-card"]',
    );
    await expect(newArrivals.first()).toBeVisible();
    await expect(newArrivals.filter({ hasText: 'Sin stock' })).toHaveCount(0);

    await expect(page.locator('[data-testid="trust-strip"]')).toBeVisible();
  });

  test('las tabs de productos populares filtran el grid', async ({ page }) => {
    await page.goto('/');
    const tabs = page.locator('[data-testid="section-tabs"] button');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });

  test('agregar al carrito como invitado actualiza el badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart"]') as HTMLElement | null;
      btn?.click();
    });
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });
});

test.describe('Header', () => {
  test('search autocomplete muestra resultados tras debounce', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Buscador oculto en mobile');
    await page.goto('/');
    const searchInput = page.locator('[data-testid="header-search-input"]');
    await searchInput.fill('Auriculares');
    // Esperar debounce de 1.7s + margen
    await page.waitForSelector('[data-testid="search-dropdown"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="search-result-item"]').first()).toBeVisible();
  });

  test('profile dropdown muestra opciones para invitado', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="profile-button"]').click();
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-login"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-register"]')).toBeVisible();
  });

  test('favoritos y carrito son visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="favorites-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-button"]')).toBeVisible();
  });
});
