import type { Locator, Page } from '@playwright/test';

/** A panel at the side of a page, such as the inspector, with an inner edge that resizes it. */
export class SidePanel {
  readonly root: Locator;
  readonly edge: Locator;

  constructor(page: Page, side: 'left' | 'right') {
    this.root = page.locator(`.with-panel.${side} > .panel`);
    this.edge = this.root.locator('> .resizer');
  }

  /** A negative number moves the edge to the left. */
  async dragEdge(byPixels: number): Promise<void> {
    const { mouse } = this.root.page();
    await this.edge.hover();
    const box = await this.edge.boundingBox();
    if (!box) throw new Error('The edge of the panel is not visible');
    const y = box.y + box.height / 2;
    await mouse.down();
    await mouse.move(box.x + box.width / 2 + byPixels, y, { steps: 5 });
    await mouse.up();
  }
}
