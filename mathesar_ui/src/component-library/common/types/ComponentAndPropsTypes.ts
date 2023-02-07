import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

/**
 * @deprecated
 *
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

/**
 * TODO: Remove ComponentAndProps and replace with ComponentWithProps,
 * when we have time to fix the type errors
 */
export type ComponentWithProps<T extends SvelteComponent> = {
  component: ComponentType<T>;
  props?: ComponentProps<T>;
};
