import type { ActionReturn } from 'svelte/action';
import { type Writable, writable } from 'svelte/store';

export interface Dimensions {
  width: number;
  height: number;
}

export function makeDimensionsStore(): Writable<Dimensions> {
  return writable({ width: 0, height: 0 });
}

export function resizeObserver(
  node: HTMLElement,
  dimensionsStore: Writable<Dimensions>,
): ActionReturn {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      dimensionsStore.set({ width, height });
    }
  });
  observer.observe(node);
  const rect = node.getBoundingClientRect();
  dimensionsStore.set({ width: rect.width, height: rect.height });
  return {
    destroy() {
      observer?.disconnect();
    },
  };
}
