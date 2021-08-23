import Moveable from 'moveable';
import type { MoveableEvents, MoveableOptions, MoveableRefType } from 'moveable';
import type { Action } from './types';

export default function moveable(
  node: HTMLElement,
  options: {
    moveableOptions: MoveableOptions,
    onResize?: CallableFunction,
    reference: HTMLElement,
  },
) : Action {
  let moveableInstance: Moveable;
  let prevReference: HTMLElement = null;
  const bubbledEventName = 'moveableMove';

  function onResize(event:MoveableEvents['resize']) {
    // eslint-disable-next-line no-param-reassign
    event.target.style.width = `${event.width}px`;
    // eslint-disable-next-line no-param-reassign
    event.target.style.height = `${event.height}px`;
    if (options.onResize) {
      options.onResize(event);
    }
  }

  function bubbleEvent() {
    moveableInstance.container.dispatchEvent(new CustomEvent(bubbledEventName));
  }

  function onBubbledEvent() {
    moveableInstance.updateTarget();
  }

  function destroy() {
    moveableInstance?.destroy();
    prevReference = null;
  }

  function create(reference: HTMLElement, moveableOptions?: MoveableOptions) {
    if (reference) {
      moveableInstance = new Moveable(document.body, moveableOptions);
      moveableInstance.target = node as MoveableRefType<HTMLElement>;
      moveableInstance.on('resize', onResize);
      moveableInstance.on('resize', bubbleEvent);
      moveableInstance.on('resizeEnd', bubbleEvent);
      moveableInstance.container.addEventListener(bubbledEventName, onBubbledEvent);
    }
  }

  function update(componentOptions: {
    moveableOptions: MoveableOptions,
    onResize?: CallableFunction,
    reference: HTMLElement,
  }) {
    const { reference, moveableOptions } = componentOptions;
    if (moveableInstance) {
      if (prevReference !== reference) {
        destroy();
        create(reference, moveableOptions);
        prevReference = reference;
      } else if (componentOptions) {
        // @TODO: Determine the best method to update option values.
      }
    } else {
      create(reference, moveableOptions);
    }
  }

  create(options.reference, options.moveableOptions);
  return {
    update,
    destroy,
  };
}
