// Screenshots for README.md: every template applied to the sample resume,
// the showcase resume and the editor. Run against a built, served app:
//
//   npm run preview &        # serves http://localhost:8787/resume-generator/
//   node scripts/readme-images.cjs
//
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
const { chromium } = require('playwright');
const path = require('node:path');

const base = process.argv[2] ?? 'http://localhost:8787/resume-generator/';
const out = path.join(__dirname, '..', 'docs', 'images');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 2600 }, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape'); // the first-visit tour
  await page.addStyleTag({ content: '.toast { display: none !important; }' });

  // Each template, applied the way a person would (so pages are fitted).
  await page.getByRole('tab', { name: 'Templates' }).click();
  for (const name of await page.locator('.template-name').allTextContents()) {
    const card = page.locator('.template-card').filter({ has: page.locator('.template-name', { hasText: new RegExp(`^${name}$`) }) });
    await card.click();
    await page.getByRole('button', { name: `Apply ${name}` }).click();
    await page.waitForTimeout(2500);
    const file = `template-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    await page.locator('.preview .rg-page').first().screenshot({ path: path.join(out, file) });
    console.log(file);
    await page.keyboard.press('Control+z');
  }

  // The editor itself.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('tab', { name: 'Content' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'editor.png') });

  // The showcase resume, as visitors see it.
  await page.setViewportSize({ width: 1000, height: 1500 });
  await page.goto(`${base}?resume=dawson&mode=view`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('.rg-page').first().screenshot({ path: path.join(out, 'showcase.png') });
  console.log('editor.png, showcase.png');
  await browser.close();
})();
