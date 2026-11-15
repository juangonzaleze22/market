import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { ADMIN_EMAIL, ADMIN_PASSWORD, API_URL, adminToken } from '../helpers/api';

const SHOP_COLLECTION = 'esencial-en-tu-despensa';

async function removeCollectionBySlug(
  request: import('@playwright/test').APIRequestContext,
  slug: string,
): Promise<void> {
  const token = await adminToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  const res = await request.get(
    `${API_URL}/admin/collections?page=1&limit=50&search=${encodeURIComponent(slug)}`,
    { headers },
  );
  if (!res.ok()) return;
  const body = await res.json();
  const match = (body.data ?? []).find(
    (collection: { slug: string }) => collection.slug === slug,
  );
  if (match) {
    await request.delete(`${API_URL}/admin/collections/${match.id}`, { headers });
  }
}

test.describe('Colecciones en la tienda', () => {
  test('la rail del shop filtra por colección', async ({ page }) => {
    await page.goto('/shop');
    const rail = page.locator('[data-testid="shop-collections-rail"]');
    await expect(rail).toBeVisible();

    await page.locator(`[data-testid="shop-collection-${SHOP_COLLECTION}"]`).click();

    await expect(page).toHaveURL(new RegExp(`collection=${SHOP_COLLECTION}`));
    await expect(page.locator('[data-testid="collection-context"]')).toContainText(
      'Esencial en tu Despensa',
    );
    await expect(page.locator('[data-testid="active-filter-tag-collection"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="shop-grid"] [data-testid="product-card"]').first(),
    ).toBeVisible();
  });

  test('Ver todo el catálogo quita la colección activa', async ({ page }) => {
    await page.goto(`/shop?collection=${SHOP_COLLECTION}`);
    await expect(page.locator('[data-testid="collection-context"]')).toBeVisible();

    await page.locator('[data-testid="clear-collection"]').click();
    await expect(page).not.toHaveURL(/collection=/);
    await expect(page.locator('[data-testid="collection-context"]')).toHaveCount(0);
  });

  test('quitar el filtro de colección vuelve al catálogo', async ({ page }) => {
    await page.goto(`/shop?collection=${SHOP_COLLECTION}`);
    await expect(page.locator('[data-testid="active-filter-tag-collection"]')).toBeVisible();

    await page.locator('[data-testid="clear-all-filters"]').click();
    await expect(page).not.toHaveURL(/collection=/);
  });
});

test.describe('Admin - Secciones', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaModal(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });
  test('crea, edita y elimina una sección', async ({ page, request }) => {
    test.setTimeout(60_000);
    const slug = `e2e-seccion-${Date.now()}`;

    try {
      await page.goto('/admin/collections');
      await expect(page.locator('[data-testid="collections-title"]')).toBeVisible();

      await page.locator('[data-testid="add-collection-btn"]').click();
      await expect(page).toHaveURL(/\/admin\/collections\/new/);
      await expect(page.locator('[data-testid="collection-editor-page"]')).toBeVisible();

      await page.locator('[data-testid="form-title"]').fill('Sección E2E');
      await page.locator('[data-testid="form-slug"]').fill(slug);
      await page.locator('[data-testid="form-subtitle"]').fill('Creada por Playwright');

      await page.locator('[data-testid="form-start"]').fill('2026-01-01T00:00');
      await page.locator('[data-testid="form-end"]').fill('2027-01-01T00:00');

      await expect(page.locator('[data-testid="suggestion-add-all"]')).toBeVisible();
      await page.locator('[data-testid="suggestion-add-all"]').click();
      await expect(page.locator('[data-testid="collection-selected-list"]')).toBeVisible();

      await page.locator('[data-testid="save-collection"]').click();
      await expect(page).toHaveURL(/\/admin\/collections$/);

      const row = page.locator(`[data-testid="collection-row-${slug}"]`);
      await expect(row).toBeVisible();
      await expect(row).toContainText('Sección E2E');
      await expect(row).toContainText('Programada');

      await row.locator('[data-testid="edit-collection"]').click();
      await expect(page).toHaveURL(/\/admin\/collections\/[^/]+\/edit/);
      await expect(page.locator('[data-testid="collection-editor-page"]')).toBeVisible();
      await page.locator('[data-testid="toggle-details"]').click();
      await page.locator('[data-testid="form-title"]').fill('Sección E2E Editada');
      await page.locator('[data-testid="save-collection"]').click();
      await expect(page).toHaveURL(/\/admin\/collections$/);
      await expect(row).toContainText('Sección E2E Editada');

      await row.locator('[data-testid="delete-collection"]').click();
      await expect(page.locator(`[data-testid="collection-row-${slug}"]`)).toHaveCount(0);
    } finally {
      await removeCollectionBySlug(request, slug);
    }
  });

  test('muestra sugerencias de autosecciones', async ({ page }) => {
    await page.goto('/admin/collections');
    await page.locator('[data-testid="add-collection-btn"]').click();
    await expect(page.locator('[data-testid="collection-editor-page"]')).toBeVisible();

    await page.locator('[data-testid="suggestion-NEWEST"]').click();
    await expect(
      page
        .locator('[data-testid="collection-product-results"] [data-testid^="collection-product-option-"]')
        .first(),
    ).toBeVisible();

    await page.locator('[data-testid="suggestion-ON_SALE"]').click();
    await expect(
      page
        .locator('[data-testid="collection-product-results"] [data-testid^="collection-product-option-"]')
        .first(),
    ).toBeVisible();

    await page.locator('[data-testid="cancel-form"]').click();
    await expect(page).toHaveURL(/\/admin\/collections$/);
  });
});
