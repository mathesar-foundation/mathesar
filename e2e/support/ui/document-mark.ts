import type { Page } from '@playwright/test';

const MARK = 'e2eDocumentMark';

type MarkedWindow = Window & Record<string, unknown>;

/** Marks the document that the page shows now. The mark is gone once the browser loads a document. */
export async function markDocument(page: Page): Promise<void> {
  await page.evaluate((mark) => {
    (window as unknown as MarkedWindow)[mark] = true;
  }, MARK);
}

/** Whether the page still shows the document that `markDocument` marked. */
export function isMarkedDocument(page: Page): Promise<boolean> {
  return page.evaluate(
    (mark) => (window as unknown as MarkedWindow)[mark] === true,
    MARK,
  );
}
