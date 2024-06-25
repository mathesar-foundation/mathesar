import type { ActionReturn } from 'svelte/action';

interface Options {
  /**
   * This function must return the slider's numerical value when the user starts
   * moving it.
   */
  getStartingValue: () => number;
  /**
   * This function will be called with the updated value while the slider is
   * moving.
   */
  onMove?: (value: number) => void;
  /**
   * This function will be called when the user starts moving the slider.
   */
  onStart?: () => void;
  /**
   * This function will be called with the final value when the user stops
   * moving the slider.
   */
  onStop?: (newValue: number) => void;
  /**
   * The minimum numerical value the slider can have.
   *
   * Defaults to `0`.
   */
  min?: number;
  /**
   * The maximum numerical value the slider can have.
   *
   * Defaults to `Infinity`.
   */
  max?: number;
  /**
   * Defaults to `'x'`.
   */
  axis?: 'x' | 'y';
  /**
   * When `false`, moving the slider leftwards or downwards will increase the
   * value.
   *
   * When `true`, moving the slider rightwards or upwards will increase the
   * value.
   *
   * Defaults to `false`.
   */
  invert?: boolean;
}

const defaults = {
  onMove: () => {},
  onStart: () => {},
  onStop: () => {},
  min: 0,
  max: Infinity,
  axis: 'x',
  invert: false,
} as const;

function getFullDefaults(options: Options): Required<Options> {
  return { ...defaults, ...options };
}

function isTouchEvent(e: MouseEvent | TouchEvent): e is TouchEvent {
  return 'touches' in e;
}

function getPosition(e: MouseEvent | TouchEvent, axis: 'x' | 'y') {
  const singularEvent = isTouchEvent(e) ? e.touches[0] : e;
  return axis === 'x' ? singularEvent.clientX : singularEvent.clientY;
}

function disableSelect(event: Event) {
  event.preventDefault();
}

/**
 * This is a Svelte action that turns an element into a trigger which can be
 * used to modify a numerical value via dragging the pointer. This action
 * doesn't _do_ anything to the DOM node. It doesn't move the node or change any
 * styles. It just binds the event listeners. In this sense, it's a pretty
 * low-level action. But it can be used to construct more elaborate interfaces
 * that rely on sliding. For example, a volume slider or a panel resizer.
 *
 * To use this action:
 *
 * 1. Provide a `getStartingValue` function so that the action knows the
 *    starting numerical value when the user grabs the trigger.
 * 2. Provide an `onMove` function to update the value as the user moves. In the
 *    parent component, you can then use this value to update the DOM however
 *    you wish, potentially moving the trigger as the user updates the value.
 * 1. Provide other options as necessary to customize the behavior.
 */
export default function slider(
  node: HTMLElement,
  options: Options,
): ActionReturn {
  const opts = getFullDefaults(options);
  let startingValue = 0;
  let startingPosition = 0;
  let value = 0;

  function setValue(v: number) {
    value = v;
    opts.onMove(value);
  }

  function clamp(v: number) {
    return Math.min(Math.max(v, opts.min), opts.max);
  }

  function move(e: MouseEvent | TouchEvent) {
    const sign = opts.invert ? -1 : 1;
    const delta = getPosition(e, opts.axis) - startingPosition;
    const newValue = clamp(startingValue + delta * sign);
    setValue(newValue);
  }

  function stop() {
    opts.onStop(value);
    window.removeEventListener('mousemove', move, true);
    window.removeEventListener('touchmove', move, true);
    window.removeEventListener('mouseup', stop, true);
    window.removeEventListener('touchend', stop, true);
    window.removeEventListener('touchcancel', stop, true);
    window.removeEventListener('selectstart', disableSelect, true);
  }

  function start(e: MouseEvent | TouchEvent) {
    e.stopPropagation();
    e.preventDefault();
    opts.onStart();
    startingValue = opts.getStartingValue();
    startingPosition = getPosition(e, opts.axis);
    window.addEventListener('mousemove', move, true);
    window.addEventListener('touchmove', move, true);
    window.addEventListener('mouseup', stop, true);
    window.addEventListener('touchend', stop, true);
    window.addEventListener('touchcancel', stop, true);
    window.addEventListener('selectstart', disableSelect, true);
  }

  node.addEventListener('mousedown', start);
  node.addEventListener('touchstart', start, { passive: false });

  return {
    destroy() {
      node.removeEventListener('mousedown', start);
      node.removeEventListener('touchstart', start);
    },
  };
}
