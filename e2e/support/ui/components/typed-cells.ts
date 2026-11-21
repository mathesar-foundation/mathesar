import type { Locator } from '@playwright/test';

/** The checkbox of a boolean cell. It is mixed while the value is NULL. */
export function cellCheckbox(cell: Locator): Locator {
  return cell.getByRole('checkbox');
}

/** The values of an array cell, in order. */
export function arrayItems(cell: Locator): Locator {
  return cell.locator('.token');
}

/** The position of the text cursor in an input. */
export function caretPosition(input: Locator): Promise<number | null> {
  return input.evaluate((element: HTMLInputElement) => element.selectionStart);
}
