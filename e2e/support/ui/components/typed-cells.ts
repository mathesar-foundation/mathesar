import type { Locator, Page } from '@playwright/test';

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

/** Whether the text cursor lies in the part of the text that an input wider than its box shows. */
export function caretIsInView(input: Locator): Promise<boolean> {
  return input.evaluate((element: HTMLInputElement) => {
    const style = getComputedStyle(element);
    const textBeforeCaret = document.createElement('span');
    for (const property of [
      'fontFamily',
      'fontSize',
      'fontStyle',
      'fontWeight',
      'fontVariantNumeric',
      'letterSpacing',
    ] as const) {
      textBeforeCaret.style[property] = style[property];
    }
    textBeforeCaret.style.whiteSpace = 'pre';
    textBeforeCaret.style.position = 'absolute';
    textBeforeCaret.textContent = element.value.slice(
      0,
      element.selectionEnd ?? 0,
    );
    document.body.append(textBeforeCaret);
    const caret =
      textBeforeCaret.getBoundingClientRect().width - element.scrollLeft;
    textBeforeCaret.remove();
    // In Chromium, the client width of an input is the width of its text box.
    return caret >= 0 && caret <= element.clientWidth;
  });
}

/** How far a dropdown is from the bottom left corner of the cell or input that opened it. */
export async function dropdownOffset(
  dropdown: Locator,
  opener: Locator,
): Promise<{ x: number; y: number }> {
  const box = await dropdown.boundingBox();
  const openerBox = await opener.boundingBox();
  if (!box || !openerBox) throw new Error('The dropdown is not visible');
  return {
    x: box.x - openerBox.x,
    y: box.y - openerBox.y - openerBox.height,
  };
}

/** The link of a URI cell. It is there while the cell is active and holds a web address. */
export function uriLink(cell: Locator): Locator {
  return cell.getByRole('link');
}

/** The button of an active user cell that lists the users to choose from. */
export function selectUserButton(cell: Locator): Locator {
  return cell.getByRole('button', { name: 'Select User' });
}

/** Shown in a user cell whose user is not a collaborator on the database. */
export function missingUserWarning(cell: Locator): Locator {
  return cell.getByLabel(
    'This user does not exist or is not a collaborator on this database.',
  );
}

/** Whether the keyboard focus rests on the page itself, outside of any control or cell. */
export function focusIsOnPage(page: Page): Promise<boolean> {
  return page.evaluate(() => document.activeElement === document.body);
}

/** A cell of an enum column, or of a boolean column shown as a dropdown, that has the keyboard focus. */
export function focusedDropdownCell(page: Page): Locator {
  return page.locator('.cell-wrapper[aria-haspopup="listbox"]:focus');
}
