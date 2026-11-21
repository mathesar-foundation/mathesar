// Opens a Chromium page that is logged in to a running Mathesar instance.
//
//   const { openMathesar } = require('./.agents/playwright/session.cjs');
//   const { browser, page, problems } = await openMathesar();
//   await page.goto('/db/1/schemas/');
//
// `problems` collects uncaught page errors and console errors seen so far.

// Same defaults as .agents/bin/dev-env, which the shell scripts use.
const BASE_URL =
  process.env.MATHESAR_URL || `http://localhost:${process.env.MATHESAR_PORT || 8000}`;
const DEFAULT_PASSWORD =
  process.env.MATHESAR_PASSWORD || process.env.DJANGO_SUPERUSER_PASSWORD || 'password';

function loadPlaywright() {
  try {
    // eslint-disable-next-line global-require
    return require('playwright');
  } catch (error) {
    throw new Error(
      'Playwright is not installed. Run `npm install -g playwright && npx playwright install chromium`, ' +
        'then `export NODE_PATH="$(npm root -g)"`.',
    );
  }
}

async function openMathesar({
  username = process.env.MATHESAR_USER || 'admin',
  password = DEFAULT_PASSWORD,
  viewport = { width: 1440, height: 900 },
  headless = true,
} = {}) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ baseURL: BASE_URL, viewport });
  const page = await context.newPage();

  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });

  await page.goto('/auth/login/');
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await page.click('form:has(input[name=username]) button[type=submit]');
  await page.waitForLoadState('networkidle');
  if (new URL(page.url()).pathname.startsWith('/auth/login')) {
    await browser.close();
    throw new Error(`Login failed for user "${username}" at ${BASE_URL}`);
  }
  return { browser, context, page, problems };
}

module.exports = { openMathesar, BASE_URL };
