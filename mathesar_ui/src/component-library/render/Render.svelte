<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import type { ComponentWithProps } from '../types';

  type T = $$Generic<SvelteComponent>;

  export let componentWithProps: ComponentWithProps<T>;

  // I'm not sure how to fix the use of `any` here. Suggestions welcome!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $: component = componentWithProps.component as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $: props = componentWithProps.props as any;
</script>

<svelte:component this={component} {...props} />
