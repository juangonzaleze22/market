import { Page } from '@playwright/test';

export async function loginViaModal(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/');
  await page.click('[data-testid="profile-button"]');
  await page.click('[data-testid="profile-login"]');
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
