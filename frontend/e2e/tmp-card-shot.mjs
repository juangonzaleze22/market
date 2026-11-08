import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:4200');
await page.waitForSelector('[data-testid="product-card"]');
await page.waitForLoadState('networkidle');
const card = page.locator('[data-testid="product-card"]').first();
await card.screenshot({ path: 'C:/Users/Juan/AppData/Local/Temp/opencode/card-new.png' });
await browser.close();
