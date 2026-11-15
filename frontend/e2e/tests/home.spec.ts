import { test, expect } from '@playwright/test';

const HOME_COLLECTION = '[data-testid="collection-esencial-en-tu-despensa"]';

test.describe('Home', () => {
  test('renderiza banner y la primera sección de colección', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('[data-testid="banner-carousel"], [data-testid="banner-single"]').first(),
    ).toBeVisible();

    const section = page.locator(HOME_COLLECTION);
    await expect(section).toBeVisible();
    await expect(
      section.locator('[data-testid="product-card"]').first(),
    ).toBeVisible();
  });

  test('las secciones de colección no muestran productos sin stock', async ({
    page,
  }) => {
    await page.goto('/');
    const cards = page.locator(
      'section[data-testid^="collection-"] [data-testid="product-card"]',
    );
    await expect(cards.first()).toBeVisible();
    await expect(cards.filter({ hasText: 'Sin stock' })).toHaveCount(0);
    await expect(
      page.locator(
        'section[data-testid^="collection-"] [data-testid="product-card"].is-out-of-stock',
      ),
    ).toHaveCount(0);
  });

  test('Ver más navega a la tienda filtrada por colección', async ({ page }) => {
    await page.goto('/');
    const section = page.locator(HOME_COLLECTION);
    await section.locator('[data-testid="view-all-link"]').click();

    await expect(page).toHaveURL(/collection=esencial-en-tu-despensa/);
    await expect(
      page.locator('[data-testid="active-filter-tag-collection"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="shop-grid"] [data-testid="product-card"]').first(),
    ).toBeVisible();
  });

  test('muestra varias secciones de merchandising', async ({ page }) => {
    await page.goto('/');
    const sections = page.locator('section[data-testid^="collection-"]');
    await expect(sections.first()).toBeVisible();
    expect(await sections.count()).toBeGreaterThanOrEqual(2);
  });

  test('muestra beneficios', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="trust-strip"]')).toBeVisible();
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

test.describe('Header mobile', () => {
  test('muestra la dirección y el saludo, y colapsa la dirección al hacer scroll', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Comportamiento exclusivo de mobile');
    await page.goto('/');

    await expect(page.locator('[data-testid="home-greeting"]')).toBeVisible();
    const address = page.locator('[data-testid="header-address-button"]');
    await expect(address).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(address).toBeHidden();
    await expect(page.locator('[data-testid="header-search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
  });
});

test.describe('Scroll', () => {
  test('el botón flotante aparece al bajar y vuelve arriba', async ({ page }) => {
    await page.goto('/shop');
    await expect(
      page.locator('[data-testid="shop-grid"] [data-testid="product-card"]').first(),
    ).toBeVisible();
    await expect(page.locator('[data-testid="scroll-to-top"]')).toHaveCount(0);

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(480);

    const button = page.locator('[data-testid="scroll-to-top"]');
    await expect(button).toBeVisible();

    await button.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(50);
  });

  test('cambiar un filtro conserva la posición del scroll', async ({ page, isMobile }) => {
    test.skip(isMobile, 'El sidebar de filtros está oculto en mobile');
    await page.goto('/shop');
    await expect(
      page.locator('[data-testid="shop-grid"] [data-testid="product-card"]').first(),
    ).toBeVisible();

    const label = page
      .locator('[data-testid="shop-filters"] label')
      .filter({ hasText: 'Bebidas' })
      .first();
    await label.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);

    await label.click();
    await expect(page).toHaveURL(/category=bebidas/);
    await page.waitForTimeout(400);

    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(200);
    expect(Math.abs(after - before)).toBeLessThan(250);
  });
});

test.describe('Header', () => {  test('search autocomplete muestra resultados tras debounce', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Buscador oculto en mobile');
    await page.goto('/');
    const searchInput = page.locator('[data-testid="header-search-input"]');
    await searchInput.fill('Harina');
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

  test('acciones del header visibles según el dispositivo', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    if (isMobile) {
      await expect(page.locator('[data-testid="favorites-button"]')).toBeHidden();
      await expect(
        page.locator('[data-testid="notifications-button"]'),
      ).toBeHidden();
    } else {
      await expect(page.locator('[data-testid="favorites-button"]')).toBeVisible();
    }

    await expect(page.locator('[data-testid="cart-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-button"]')).toBeVisible();
  });
});
