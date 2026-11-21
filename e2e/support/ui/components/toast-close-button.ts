import type { Locator } from '@playwright/test';

import type { Toasts } from './toast';

/** The cross that dismisses a toast. It has no accessible name. */
export function toastCloseButton(toasts: Toasts): Locator {
  return toasts.items.getByRole('button');
}
