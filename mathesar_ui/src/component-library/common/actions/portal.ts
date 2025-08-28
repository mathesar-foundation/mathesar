import type { ActionReturn } from 'svelte/action';

export default function portal(
  node: Element,
  target?: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ActionReturn<any> {
  const targetElement = target ?? document.querySelector('body') ?? undefined;

  function update(newTarget: HTMLElement | undefined) {
    if (newTarget && newTarget instanceof HTMLElement) {
      newTarget.appendChild(node);
    }
  }

  function destroy() {
    node.parentElement?.removeChild(node);
  }

  update(targetElement);

  return {
    update,
    destroy,
  };
}
