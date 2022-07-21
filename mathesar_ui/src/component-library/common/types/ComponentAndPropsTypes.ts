import type { SvelteComponent } from 'svelte';

export interface ComponentAndProps<T = Record<string, unknown>> {
  component: typeof SvelteComponent;
  props?: T;
}
