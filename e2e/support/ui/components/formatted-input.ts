import type { Locator } from '@playwright/test';

/**
 * Replaces the text of an input that formats what the user types, such as a number or a
 * date input. `fill` types an IME composition in Firefox, which these inputs drop.
 */
export async function fillFormattedInput(
  input: Locator,
  text: string,
): Promise<void> {
  await input.clear();
  await input.pressSequentially(text);
}
