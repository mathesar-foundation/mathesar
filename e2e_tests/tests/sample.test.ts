import { test, expect } from '@playwright/test';

test('Mathesar loads successfully', async ({ page }) => {
  await page.goto('/');
  // A fresh Mathesar instance with no superuser redirects to /complete_installation/
  await expect(page).toHaveURL(/complete_installation/);
  await expect(page.locator('h1')).toContainText('Finish Setting Up Mathesar');
});
