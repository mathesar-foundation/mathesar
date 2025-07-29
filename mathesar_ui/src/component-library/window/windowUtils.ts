import { concat, first } from 'iter-tools';
import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

import { focusElement, getFocusableElements } from '../common/utils';

async function moveNodeToFooter(node: Element): Promise<void> {
  await tick();
  node
    .closest('[data-window-area="window"]')
    ?.querySelector(':scope > [data-window-area="footer"]')
    ?.appendChild(node);
}

export function portalToWindowFooter(node: Element): ActionReturn {
  void moveNodeToFooter(node);
  return {
    destroy: () => node.parentElement?.removeChild(node),
  };
}

/**
 * Focus the first focusable element inside a Window component.
 *
 * @param container Can be the window element itself, or an ancestor of it.
 */
export function focusFirstElementInWindow(container: Element): void {
  function* getFocusableElementsInArea(selector: string) {
    const e = container.querySelector(selector);
    if (!e) return;
    yield* getFocusableElements(e);
  }

  const focusableElements = concat(
    getFocusableElementsInArea('[data-window-area="body"]'),
    getFocusableElementsInArea('[data-window-area="footer"]'),
    getFocusableElementsInArea('[data-window-area="title-bar"]'),
  );

  const firstFocusableElement = first(focusableElements);
  if (!firstFocusableElement) return;
  focusElement(firstFocusableElement);
}
