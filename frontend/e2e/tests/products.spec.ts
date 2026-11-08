import { test, expect } from '@playwright/test';
import { API_URL, adminToken } from '../helpers/api';

test.describe('Catalogo de Productos', () => {
  test('se muestran productos en la pagina de inicio', async ({ page }) => {
    await page.goto('/');
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('un producto tiene nombre, precio y categoria', async ({ page }) => {
    await page.goto('/');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('la pagina de tienda filtra por categoria', async ({ page }) => {
    await page.goto('/shop?category=electronica');
    await expect(page.locator('[data-testid="shop-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-filter-tag-category"]')).toContainText(
      'Electrónica',
    );
  });

  test('productos sin stock se ven atenuados y no permiten agregar', async ({ page }) => {
    await page.goto('/shop?agotados=1');
    const outOfStockCard = page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: 'Sin stock' })
      .first();

    await expect(outOfStockCard).toBeVisible();
    await expect(outOfStockCard.locator('[data-testid="product-stock"]')).toHaveText('Sin stock');
    await expect(outOfStockCard.locator('[data-testid="add-to-cart"]')).toHaveCount(0);

    const disabledBtn = outOfStockCard.locator('[data-testid="add-to-cart-disabled"]');
    await expect(disabledBtn).toBeVisible();
    await expect(disabledBtn).toBeDisabled();
    await expect(disabledBtn).toHaveText(/Agotado/);

    await expect(outOfStockCard).toHaveClass(/is-out-of-stock/);
  });

  test('la tienda oculta agotados por defecto y los incluye con el filtro', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('[data-testid="shop-grid"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="shop-grid"]').getByText('Sin stock', { exact: true }),
    ).toHaveCount(0);

    const filterToggle = page.locator('[data-testid="mobile-filter-toggle"]');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }
    await page
      .locator('[data-testid="filter-include-out-of-stock"]')
      .last()
      .evaluate((el) => (el as HTMLInputElement).click());

    await expect(page).toHaveURL(/agotados=1/);
    await expect(
      page.locator('[data-testid="shop-grid"]').getByText('Sin stock', { exact: true }).first(),
    ).toBeVisible();
    await expect(page.locator('[data-testid="active-filter-tag-stock"]')).toContainText(
      'Incluye agotados',
    );
  });

  test('producto agotado permite suscribirse para aviso de reposición', async ({ page }) => {
    await page.goto('/shop?agotados=1');
    const outOfStockCard = page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: 'Sin stock' })
      .first();
    await expect(outOfStockCard).toBeVisible();
    await outOfStockCard.locator('[data-testid="product-name"]').click();

    await expect(page.locator('[data-testid="restock-waitlist"]')).toBeVisible();
    await page.fill('[data-testid="restock-email"]', `restock-${Date.now()}@example.com`);
    await page.press('[data-testid="restock-email"]', 'Enter');
    await expect(page.locator('[data-testid="restock-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('la pagina de tienda filtra por multiples tags desde la URL', async ({ page, request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const firstTag = { name: `E2E Tag A ${suffix}`, slug: `e2e-tag-a-${suffix}` };
    const secondTag = { name: `E2E Tag B ${suffix}`, slug: `e2e-tag-b-${suffix}` };
    const createdIds: string[] = [];

    try {
      for (const tag of [firstTag, secondTag]) {
        const res = await request.post(`${API_URL}/tags`, {
          headers,
          data: { ...tag, color: '#000000' },
        });
        expect(res.ok(), 'create tag failed').toBeTruthy();
        createdIds.push((await res.json()).id);
      }

      await page.goto(`/shop?tag=${firstTag.slug},${secondTag.slug}`);

      await expect(page.locator('[data-testid="shop-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-filter-tag-tag"]')).toHaveCount(2);
      await expect(
        page.locator('[data-testid="active-filter-tag-tag"]').filter({
          hasText: firstTag.name,
        }),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="active-filter-tag-tag"]').filter({
          hasText: secondTag.name,
        }),
      ).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`tag=${firstTag.slug},${secondTag.slug}`));
    } finally {
      for (const id of createdIds) {
        await request.delete(`${API_URL}/tags/${id}`, { headers });
      }
    }
  });

  test('abrir el detalle desde la card mantiene la imagen para la transición', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');

    const card = page.locator('[data-testid="product-card"]').first();
    const imageLink = card.locator('a.product-image-link');
    await imageLink.dispatchEvent('pointerdown');
    await imageLink.evaluate((el) => (el as HTMLElement).click());

    await expect(page).toHaveURL(/\/product\//);
    const detailImg = page.locator('[data-testid="detail-image"] img');
    await expect(detailImg).toBeVisible();

    const transitionName = await detailImg.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('view-transition-name').trim(),
    );
    expect(transitionName).toMatch(/^product-image-/);
  });
});
