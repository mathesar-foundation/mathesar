import type { Action } from './actionsTypes';

export default function portal(node: Element, target?: HTMLElement): Action {
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
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    update,
    destroy,
  };
}
