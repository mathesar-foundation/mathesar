import type { Locator } from '@playwright/test';

import type { Modal } from './modal';

/** The cross in the title bar. A modal that lies under another modal has none. */
export function modalCloseButton(modal: Modal): Locator {
  return modal.root
    .locator('[data-window-area="title-bar"]')
    .getByRole('button');
}

/** The veil between a modal and the page. Only the topmost modal has one. */
export function modalOverlay(modal: Modal): Locator {
  return modal.root.locator('.overlay');
}
