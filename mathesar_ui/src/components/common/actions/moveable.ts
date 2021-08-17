import type { Action } from './types';
import Moveable, { MoveableEvents, MoveableOptions } from 'moveable';
export default function moveable(
  node: HTMLElement,
  options: {
    moveableOptions: MoveableOptions,
    onResize?,
    onResizeEnd?,
  }

) : Action {
  let moveable: Moveable;
  node.addEventListener('mouseenter', create);
  node.addEventListener('mouseleave', destroy);
  function create({ target }) {
    moveable = new Moveable(document.body, options.moveableOptions);
    moveable.target = target;
    if (options.moveableOptions.resizable) {
      moveable.on('resize', (event:MoveableEvents['resize']) => {
        target.style.width = `${event.width}px`;
        target.style.height = `${event.height}px`;
        if (options.onResize) {
          options.onResize(event)
        }
      })
    }
  }
  function destroy() {
    moveable?.destroy();
  }

  return {
    destroy,
  };
}
