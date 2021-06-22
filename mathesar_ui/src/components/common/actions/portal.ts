import type { Action } from './types.d';

export default function portal(node: Element, target?: HTMLElement) : Action {
  const targetElement = target ?? document.querySelector('body');

  function update(newTarget: HTMLElement) {
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
