/**
 * Forked from "react-window@1.8.6"
 * Copyright (c) 2018 Brian Vaughn
 *
 * Animation frame based implementation of setTimeout.
 * Inspired by Joe Lambert, https://gist.github.com/joelambert/1002116#file-requesttimeout-js
 *
 * This fork includes the following additional changes:
 * 1. Ported to TS
 */

const hasNativePerformanceNow = typeof performance === 'object'
  && typeof performance.now === 'function';

const now = hasNativePerformanceNow
  ? () => performance.now()
  : () => Date.now();

export function cancelTimeout(timeout: { id: number }): void {
  cancelAnimationFrame(timeout.id);
}

export function requestTimeout(
  callback: () => unknown,
  delay: number,
): { id: number } {
  const start = now();
  // Using an object instead of number, to reuse same object on tick
  const timeout = { id: null };

  function tick() {
    if (now() - start >= delay) {
      callback.call(null);
    } else {
      timeout.id = requestAnimationFrame(tick);
    }
  }

  timeout.id = requestAnimationFrame(tick);
  return timeout;
}
