import type { Locator } from '@playwright/test';

import { SidePanel } from '../../support/ui/components/side-panel';
import { expect, test } from './fixtures';

async function widthOf(locator: Locator): Promise<number | undefined> {
  return (await locator.boundingBox())?.width;
}

test.describe('the inspector panel', () => {
  test('dragging its edge resizes it, and the width survives a reload', async ({
    page,
    tablePage,
  }) => {
    const inspectorPanel = new SidePanel(page, 'right');
    await expect.poll(() => widthOf(inspectorPanel.root)).toBe(350);
    await inspectorPanel.dragEdge(-100);
    await expect.poll(() => widthOf(inspectorPanel.root)).toBe(450);

    await page.reload();
    await tablePage.expectLoaded();
    await expect.poll(() => widthOf(inspectorPanel.root)).toBe(450);
  });

  test('keeps a width between 200 and 600 pixels', async ({
    page,
    tablePage,
  }) => {
    const inspectorPanel = new SidePanel(page, 'right');
    await expect(tablePage.inspector.root).toBeVisible();
    // Further right, the mouse leaves the page, where Firefox reports it at x 0.
    await inspectorPanel.dragEdge(200);
    await expect.poll(() => widthOf(inspectorPanel.root)).toBe(200);

    await inspectorPanel.dragEdge(-600);
    await expect.poll(() => widthOf(inspectorPanel.root)).toBe(600);
  });

  test('each section keeps its open or closed state after a reload', async ({
    page,
    tablePage,
    tableTab,
  }) => {
    await expect(tableTab.noUserColumnNote).toHaveCount(0);
    await tableTab.userTracking.header.click();
    await expect(tableTab.noUserColumnNote).toBeVisible();
    await tableTab.properties.header.click();
    await expect(tableTab.name.input).toHaveCount(0);

    await page.reload();
    await tablePage.expectLoaded();
    await expect(tableTab.noUserColumnNote).toBeVisible();
    await expect(tableTab.name.input).toHaveCount(0);
  });
});
