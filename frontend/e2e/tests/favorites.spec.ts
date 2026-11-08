import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { registerCustomer } from '../helpers/api';

async function registerFreshUser(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const customer = await registerCustomer(request);
  await page.addInitScript(
    ({ token, userId, email }) => {
      localStorage.setItem('market_token', token);
      localStorage.setItem(
        'market_user',
        JSON.stringify({
          id: userId,
          email,
          firstName: 'Fav',
          lastName: 'Tester',
          role: 'customer',
          emailVerified: true,
        }),
      );
    },
    { token: customer.token, userId: customer.userId, email: customer.email },
  );
  await page.goto('/');
}

test.describe('Favoritos', () => {
  test('invitado recibe prompt de login al marcar un favorito', async ({
    page,
  }) => {
    await page.goto('/shop');
    const card = page.locator('[data-testid="product-card"]').first();
    await card.locator('[data-testid="favorite-button"]').click();
    await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('usuario marca, visualiza y quita favoritos', async ({
    page,
    request,
  }) => {
    await registerFreshUser(page, request);
    await page.goto('/shop');

    const card = page.locator('[data-testid="product-card"]').first();
    const name = (
      (await card.locator('[data-testid="product-name"]').textContent()) ?? ''
    ).trim();
    expect(name.length).toBeGreaterThan(0);

    const heart = card.locator('[data-testid="favorite-button"]');
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites') &&
        response.request().method() === 'POST',
    );
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect((await saved).ok()).toBeTruthy();

    await page.reload();
    const reloadedCard = page
      .locator('[data-testid="product-card"]')
      .filter({ hasText: name })
      .first();
    await expect(
      reloadedCard.locator('[data-testid="favorite-button"]'),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.locator('[data-testid="favorites-button"]').click();
    await expect(page).toHaveURL(/\/favorites/);
    await expect(page.locator('[data-testid="favorites-page"]')).toBeVisible();

    const grid = page.locator('[data-testid="favorites-grid"]');
    await expect(grid).toBeVisible();
    const favoriteCard = grid
      .locator('[data-testid="product-card"]')
      .filter({ hasText: name })
      .first();
    await expect(favoriteCard.locator('[data-testid="product-name"]')).toHaveText(
      name,
    );
    await expect(
      favoriteCard.locator('[data-testid="favorite-button"]'),
    ).toHaveAttribute('aria-pressed', 'true');

    const removed = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites/') &&
        response.request().method() === 'DELETE',
    );
    await favoriteCard.locator('[data-testid="favorite-button"]').click();
    await expect(
      page.locator('[data-testid="product-card"]').filter({ hasText: name }),
    ).toHaveCount(0);
    expect((await removed).ok()).toBeTruthy();
  });
});
