import type { ActionReturn } from 'svelte/action';
import { type Readable, get } from 'svelte/store';

type CallbackFn = (e: Event) => void;
interface Options {
  callback: CallbackFn;
  references?: Readable<(HTMLElement | undefined)[]>;
}

export default function clickOffBounds(
  node: Element,
  options: Options,
): ActionReturn {
  let { callback, references } = options;

  function outOfBoundsListener(event: Event) {
    const isWithinReferenceElement =
      references &&
      get(references)?.some(
        (reference) => reference?.contains?.(event.target as Node) ?? false,
      );
    if (!isWithinReferenceElement && !node.contains(event.target as Node)) {
      callback(event);
    }
  }

  /**
   * When the browser supports pointer events, we use the pointerdown event
   * which is fired for all mouse buttons and touches. However, older Safari
   * versions don't have pointer events, so we fallback to mouse events. Touches
   * should fire a mousedown event too.
   */
  const events =
    'onpointerdown' in document.body
      ? ['pointerdown']
      : ['mousedown', 'contextmenu'];

  events.forEach((event) => {
    document.body.addEventListener(event, outOfBoundsListener, true);
  });

  function update(opts: Options) {
    callback = opts.callback;
    references = opts.references;
  }

  function destroy() {
    events.forEach((event) => {
      document.body.removeEventListener(event, outOfBoundsListener, true);
    });
  }

  return {
    update,
    destroy,
  };
}
