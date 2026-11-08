import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4307');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'C:/Users/Juan/AppData/Local/Temp/opencode/small-font-screenshot.png', fullPage: true });
  await browser.close();
})();
