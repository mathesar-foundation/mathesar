import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

import type { ComponentWithProps } from '../types/ComponentAndPropsTypes';

/**
 * This is a utility function which prepares a pair of component/props objects
 * to be rendered.
 *
 * This function exists to work around the fact that TypeScript does not have
 * "existential types". What you put _in_ this function is type-safe. But what
 * you get _out_ is not. You can use this function to wrap pairs of
 * component/props objects in a type-safe manner while still being able to pass
 * them around later without using generics.
 */
export function component<T extends SvelteComponent>(
  c: ComponentType<T>,
  p: ComponentProps<T>,
): ComponentWithProps<T> {
  return { component: c, props: p };
}
