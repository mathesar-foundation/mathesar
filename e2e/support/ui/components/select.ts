import type { Locator } from '@playwright/test';

/** The options of a custom select, which render outside its trigger button. */
export async function openSelect(trigger: Locator): Promise<Locator> {
  await trigger.click();
  const listboxId = await trigger.getAttribute('aria-controls');
  return trigger.page().locator(`[id="${listboxId}"]`);
}

export async function chooseOption(
  trigger: Locator,
  option: string | RegExp,
): Promise<void> {
  const listbox = await openSelect(trigger);
  await listbox.getByRole('option', { name: option, exact: true }).click();
}
