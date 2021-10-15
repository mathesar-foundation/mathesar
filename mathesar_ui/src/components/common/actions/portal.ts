import type { Action } from './types.d';

interface PortalProps {
  target?: HTMLElement,
  /**
   * Set this to `false` to disable the portal action. Defaults to `true`.
   */
  isEnabled?: boolean,
}

export default function portal(node: Element, props: PortalProps) : Action {
  const targetElement = props.target ?? document.querySelector('body');
  const isEnabled = props.isEnabled ?? true;

  function update(newTarget: HTMLElement) {
    if (!isEnabled) {
      return;
    }
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
