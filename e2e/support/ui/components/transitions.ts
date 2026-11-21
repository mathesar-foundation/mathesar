import { type Locator, expect } from '@playwright/test';

/** Runs in the page: the animations that are under way and come to an end, such as an outro. */
function countRunningTransitions(): number {
  return document
    .getAnimations()
    .filter(
      (animation) =>
        animation.playState === 'running' &&
        animation.effect?.getComputedTiming().iterations !== Infinity,
    ).length;
}

/**
 * Checks that a dropdown, popover or editor is open and stays open. One that closes
 * stays on the page while it fades out, so this checks again after the transitions end.
 */
export async function expectStaysOpen(element: Locator): Promise<void> {
  await expect(element).toBeVisible();
  await expect
    .poll(() => element.page().evaluate(countRunningTransitions), {
      message: 'the transitions of the page have ended',
    })
    .toBe(0);
  await expect(element).toBeVisible();
}
