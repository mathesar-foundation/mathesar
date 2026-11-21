import { pauseClock } from '../../support/ui/clock';
import { HomePage } from '../../support/ui/pages/home-page';
import { expect, test } from './fixtures';

test.describe('help tooltip', () => {
  let homePage: HomePage;

  // The search box that the pointer moves to shows only while a database exists.
  test.beforeEach(async ({ page, database }) => {
    homePage = new HomePage(page);
    await page.clock.install();
    await homePage.goto();
    await expect(homePage.card(database.name)).toBeVisible();
    await homePage.help.hover();
    await expect(homePage.tooltip).toBeVisible();
  });

  test('opens above its icon, centered on it', async () => {
    const icon = (await homePage.help.boundingBox())!;
    const tooltipBox = async () => (await homePage.tooltip.boundingBox())!;

    await expect
      .poll(async () => {
        const tooltip = await tooltipBox();
        return Math.abs(tooltip.y + tooltip.height - icon.y);
      })
      .toBeLessThan(2);
    await expect
      .poll(async () => {
        const tooltip = await tooltipBox();
        return Math.abs(
          tooltip.x + tooltip.width / 2 - (icon.x + icon.width / 2),
        );
      })
      .toBeLessThan(2);
  });

  test('gives the pointer a moment to reach it and stays open while the pointer is on it', async ({
    page,
  }) => {
    await pauseClock(page);
    await homePage.search.hover();
    await expect(homePage.tooltip).toBeVisible();

    await homePage.tooltip.hover();
    await page.clock.runFor(1000);
    await expect(homePage.tooltipLink).toBeVisible();

    await homePage.search.hover();
    await expect(homePage.tooltip).toBeHidden();
  });

  test('closes a moment after the pointer leaves its icon', async ({
    page,
  }) => {
    await homePage.search.hover();
    await page.clock.runFor(1000);

    await expect(homePage.tooltip).toBeHidden();
  });
});
