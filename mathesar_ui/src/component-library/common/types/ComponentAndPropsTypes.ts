import type { SvelteComponent } from 'svelte';

/**
 * Why `T = unknown` here?
 *
 * This was previously `T = Record<string, unknown>` which seemed to make more
 * sense at first because props must be objects. But then we ran into some TS
 * errors that appeared to be related to this [open TS issue][1]. Using
 * `unknown` sacrifices some type safety but it obviates weird hacks to get
 * around that TS issue.
 *
 * [1]: https://github.com/microsoft/TypeScript/issues/37491
 */
export interface ComponentAndProps<T = unknown> {
  component: typeof SvelteComponent;
  props?: T;
}
