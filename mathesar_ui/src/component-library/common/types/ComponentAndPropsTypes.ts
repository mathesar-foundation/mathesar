import type { SvelteComponent } from 'svelte';

export interface ComponentAndProps {
  component: typeof SvelteComponent;
  props?: Record<string, unknown>;
}
