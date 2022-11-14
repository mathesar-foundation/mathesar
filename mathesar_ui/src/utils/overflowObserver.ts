import { writable, type Writable } from 'svelte/store';
import type { ActionReturn } from 'svelte/action';

export interface OverflowDetails {
  hasOverflowTop: Writable<boolean>;
  hasOverflowLeft: Writable<boolean>;
  hasOverflowBottom: Writable<boolean>;
  hasOverflowRight: Writable<boolean>;
}

export function makeOverflowDetails(): OverflowDetails {
  return {
    hasOverflowTop: writable(false),
    hasOverflowLeft: writable(false),
    hasOverflowBottom: writable(false),
    hasOverflowRight: writable(false),
  };
}

/**
 * Apply this action on a container that has `overflow: auto;`. The
 * `OverflowDetails` object you pass in will be reactively updated so that you
 * can tell when the content of your container is overflowing.
 */
export default function overflowObserver(
  node: HTMLElement,
  overflowDetails: OverflowDetails,
): ActionReturn {
  const {
    hasOverflowTop,
    hasOverflowLeft,
    hasOverflowBottom,
    hasOverflowRight,
  } = overflowDetails;

  function handleChange() {
    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = node;
    hasOverflowTop.set(scrollTop > 0);
    hasOverflowLeft.set(scrollLeft > 0);
    hasOverflowBottom.set(
      Math.abs(scrollHeight - clientHeight - scrollTop) > 1,
    );
    hasOverflowRight.set(Math.abs(scrollWidth - clientWidth - scrollLeft) > 1);
  }

  node.addEventListener('scroll', handleChange);
  const resizeObserver = new ResizeObserver(handleChange);
  resizeObserver.observe(node);

  return {
    destroy: () => {
      node.removeEventListener('scroll', handleChange);
      resizeObserver.disconnect();
    },
  };
}
