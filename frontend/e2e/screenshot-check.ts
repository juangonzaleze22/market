import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Juan/AppData/Local/Temp/opencode/home-screenshot.png', fullPage: true });
  await browser.close();
})();
