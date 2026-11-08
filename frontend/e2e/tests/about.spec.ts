import { test, expect } from '@playwright/test';

test.describe('Quiénes somos', () => {
  test('muestra el hero y las migas de pan', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('[data-testid="about-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-hero-title"]')).toHaveText('Quiénes somos');
    await expect(page.locator('[data-testid="page-hero-breadcrumbs"]')).toContainText('Inicio');
  });

  test('renderiza historia, impacto, visión, misión y equipo', async ({ page }) => {
    await page.goto('/about');

    await expect(page.locator('[data-testid="about-story-title"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="about-story-checklist"] li'),
    ).toHaveCount(3);

    await expect(page.locator('[data-testid="about-stats"]')).toBeVisible();

    await expect(page.locator('[data-testid="about-vision"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-mission"]')).toBeVisible();

    await expect(page.locator('[data-testid="about-team-card"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="about-benefits"] .benefit')).toHaveCount(3);
  });

  test('carga los conteos de productos y categorías desde la API', async ({ page }) => {
    await page.goto('/about');

    const values = page.locator('[data-testid="about-stats"] .stat strong');
    await expect(values.nth(1)).toHaveText(/^\d[\d.,]*$/);
    await expect(values.nth(2)).toHaveText(/^\d[\d.,]*$/);
  });

  test('valida el correo y confirma la suscripción al newsletter', async ({ page }) => {
    await page.goto('/about');

    const submit = page.locator('[data-testid="about-newsletter-submit"]');
    const email = page.locator('[data-testid="about-newsletter-email"]');

    await submit.click();
    await expect(page.locator('[data-testid="about-newsletter-error"]')).toContainText(
      'correo electrónico válido',
    );

    await email.fill('correo-invalido');
    await submit.click();
    await expect(page.locator('[data-testid="about-newsletter-error"]')).toBeVisible();

    await email.fill('cliente@example.com');
    await submit.click();
    await expect(page.locator('[data-testid="about-newsletter-success"]')).toBeVisible();
    await expect(email).toHaveCount(0);
  });

  test('se accede desde el navbar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Los links del navbar están ocultos en mobile');

    await page.goto('/');
    await page.locator('[data-testid="navbar"]').getByRole('link', { name: 'Quiénes somos' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('[data-testid="page-hero-title"]')).toHaveText('Quiénes somos');
  });
});
