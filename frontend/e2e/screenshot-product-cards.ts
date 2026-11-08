import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4309');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Juan/AppData/Local/Temp/opencode/product-cards-screenshot.png', fullPage: true });
  await browser.close();
})();
