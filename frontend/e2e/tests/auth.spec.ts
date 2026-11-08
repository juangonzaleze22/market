import { test, expect } from '@playwright/test';
import { loginViaModal } from '../helpers/login';
import { API_URL } from '../helpers/api';

test.describe('Flujo de Autenticacion', () => {
  const testPassword = 'TestPassword123!';

  test('un usuario puede registrarse y se le pide verificar el correo', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    await page.goto('/');
    await page.click('[data-testid="profile-button"]');
    await page.click('[data-testid="profile-register"]');
    await page.fill('[data-testid="auth-register-firstName"]', 'Test');
    await page.fill('[data-testid="auth-register-lastName"]', 'User');
    await page.fill('[data-testid="auth-register-email"]', testEmail);
    await page.fill('[data-testid="auth-register-password"]', testPassword);
    await page.fill('[data-testid="auth-register-confirmPassword"]', testPassword);
    await page.click('[data-testid="auth-register-submit"]');

    const success = page.locator('[data-testid="auth-register-success"]');
    await expect(success).toBeVisible({ timeout: 10000 });
    await expect(success).toContainText('Revisa tu correo');
    await expect(page.locator('[data-testid="auth-modal"]')).toContainText(testEmail);

    await page.click('[data-testid="auth-register-back-login"]');
    await expect(page.locator('[data-testid="auth-login-email"]')).toBeVisible();
  });

  test('el registro rechaza contraseñas débiles', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="profile-button"]');
    await page.click('[data-testid="profile-register"]');
    await page.fill('[data-testid="auth-register-firstName"]', 'Weak');
    await page.fill('[data-testid="auth-register-lastName"]', 'Pass');
    await page.fill('[data-testid="auth-register-email"]', `weak-${Date.now()}@example.com`);
    await page.fill('[data-testid="auth-register-password"]', 'abcdefgh');
    await page.fill('[data-testid="auth-register-confirmPassword"]', 'abcdefgh');
    await expect(page.locator('[data-testid="auth-register-submit"]')).toBeDisabled();
  });

  test('un usuario verifica su correo y puede iniciar sesion', async ({ page, request }) => {
    const testEmail = `verify-${Date.now()}@example.com`;

    const register = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        firstName: 'Verify',
        lastName: 'User',
      },
    });
    expect(register.status()).toBe(202);
    const body = await register.json();
    expect(body.devVerificationToken).toBeTruthy();

    const blocked = await request.post(`${API_URL}/auth/login`, {
      data: { email: testEmail, password: testPassword },
    });
    expect(blocked.status()).toBe(403);

    await page.goto(
      `/verify-email?token=${encodeURIComponent(body.devVerificationToken)}`,
    );
    await expect(page.locator('[data-testid="verify-email-status"]')).toContainText(
      'Correo verificado',
      { timeout: 10000 },
    );

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await loginViaModal(page, testEmail, testPassword);
    await page.click('[data-testid="profile-button"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="profile-dropdown"]')).toContainText(
      'Verify User',
    );
  });

  test('un usuario puede iniciar sesion con la cuenta de test', async ({ page }) => {
    await loginViaModal(page, 'test@example.com', 'password');
    await page.click('[data-testid="profile-button"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="profile-dropdown"]')).toContainText('Test User');
  });

  test('la recuperacion de contraseña responde de forma generica', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('[data-testid="forgot-password-email"]', `missing-${Date.now()}@example.com`);
    await page.click('[data-testid="forgot-password-submit"]');
    await expect(page.locator('[data-testid="forgot-password-status"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
