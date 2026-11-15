import { Page } from '@playwright/test';

export async function openAuthModal(
  page: Page,
  view: 'login' | 'register',
): Promise<void> {
  const profileButton = page.locator('[data-testid="profile-button"]');

  if (await profileButton.isVisible()) {
    await profileButton.click();
    await page.click(
      view === 'login'
        ? '[data-testid="profile-login"]'
        : '[data-testid="profile-register"]',
    );
    return;
  }

  await page.goto('/account');
  await page
    .locator('[data-testid="auth-modal"]')
    .waitFor({ state: 'visible', timeout: 10000 });

  if (view === 'register') {
    await page.getByRole('button', { name: 'Regístrate' }).click();
  }
}

export async function loginViaModal(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/');
  await openAuthModal(page, 'login');
  const modal = page.locator('[data-testid="auth-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  await page.fill('[data-testid="auth-login-email"]', email);
  await page.fill('[data-testid="auth-login-password"]', password);
  await page.click('[data-testid="auth-login-submit"]');
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="auth-modal"]');
      return el && !el.classList.contains('open');
    },
    { timeout: 15000 },
  );
  await modal.waitFor({ state: 'hidden', timeout: 5000 });
}
