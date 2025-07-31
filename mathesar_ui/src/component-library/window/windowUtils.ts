import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

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
