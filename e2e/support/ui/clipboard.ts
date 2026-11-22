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

/**
 * Puts cells on the clipboard the way a copy in Mathesar does: the plain text,
 * and an HTML table that carries the cells as JSON.
 */
export async function writeMathesarClipboard(
  page: Page,
  cells: unknown,
  text: string,
): Promise<void> {
  const content = encodeURIComponent(JSON.stringify(cells));
  const html = `<table data-mathesar-content="${content}"></table>`;
  await page.evaluate(
    ({ html, text }) =>
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]),
    { html, text },
  );
}
