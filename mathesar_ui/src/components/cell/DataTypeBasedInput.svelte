<script lang="ts">
  // This component is to be used where column specific input is required
  // Eg., while filtering, grouping, setting default value etc.,

  import { getDbTypeBasedInputComponentWithProps } from './utils';
  import type { CellColumnLike } from './data-types/typeDefinitions';

  export let column: CellColumnLike;
  export let value: unknown;

  $: ({ component, props } = getDbTypeBasedInputComponentWithProps(column));
</script>

<svelte:component
  this={component}
  {...$$restProps}
  {...props}
  bind:value
  on:input
  on:change
/>
