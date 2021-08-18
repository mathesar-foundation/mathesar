import Moveable from 'moveable';
import type { MoveableEvents, MoveableOptions, MoveableRefType } from 'moveable';
import type { Action } from './types';

export default function moveable(
  node: HTMLElement,
  options: {
    moveableOptions: MoveableOptions,
    onResize?: CallableFunction,
    onResizeEnd?: CallableFunction,
  },
) : Action {
  let moveableComponent: Moveable;
  let isResizing = false;

  function resize(event:MoveableEvents['resize']) {
    // eslint-disable-next-line no-param-reassign
    event.target.style.width = `${event.width}px`;
    // eslint-disable-next-line no-param-reassign
    event.target.style.height = `${event.height}px`;
    if (options.onResize) {
      options.onResize(event);
    }
  }

  function destroy() {
    moveableComponent?.destroy();
    moveableComponent = null;
  }

  function create() {
    const target:HTMLElement = node;
    if (moveableComponent) {
      destroy();
    }
    moveableComponent = new Moveable(document.body, options.moveableOptions);
    moveableComponent.target = target as MoveableRefType<HTMLElement>;
    moveableComponent.on('resize', resize);
    moveableComponent.on('resizeStart', () => { isResizing = true; });
    moveableComponent.on('resizeEnd', () => { isResizing = false; });
  }

  let mouseEnterTimer;
  let mouseLeaveTimer;
  node.addEventListener('mouseenter', () => {
    if (isResizing) return;
    mouseEnterTimer = setTimeout(() => {
      if (mouseLeaveTimer) {
        clearTimeout(mouseEnterTimer);
        mouseEnterTimer = null;
        return;
      }
      if (!isResizing) {
        create();
      }
      mouseEnterTimer = null;
    }, 100);
  });
  node.addEventListener('mouseleave', () => {
    if (isResizing) return;
    mouseLeaveTimer = setTimeout(() => {
      if (mouseEnterTimer) {
        clearTimeout(mouseLeaveTimer);
        mouseLeaveTimer = null;
      }
      if (!isResizing) {
        destroy();
      }
      mouseLeaveTimer = null;
    }, 500);
  });
  return {
    destroy,
  };
}
