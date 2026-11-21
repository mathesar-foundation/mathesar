import type { Page } from '@playwright/test';

export function readClipboardText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

/** Puts plain text on the clipboard, as a copy in another application would. */
export async function writeClipboardText(
  page: Page,
  text: string,
): Promise<void> {
  await page.evaluate((value) => navigator.clipboard.writeText(value), text);
}
