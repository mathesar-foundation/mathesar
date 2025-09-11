import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

async function moveNodeToWindowArea(
  node: Element,
  relativeSelector: string,
): Promise<void> {
  await tick();
  node
    .closest('[data-window-area="window"]')
    ?.querySelector(relativeSelector)
    ?.appendChild(node);
}

function makeWindowAreaPortal(
  relativeSelector: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (node: Element) => ActionReturn<any> {
  return (node: Element) => {
    void moveNodeToWindowArea(node, relativeSelector);
    return { destroy: () => node.parentElement?.removeChild(node) };
  };
}

export const portalToWindowTitle = makeWindowAreaPortal(
  ':scope > [data-window-area="title-bar"] > [data-window-area="title"]',
);

export const portalToWindowFooter = makeWindowAreaPortal(
  ':scope > [data-window-area="footer"]',
);
