<script lang="ts">
  import type { CellValueFormatter } from './cell/utils';

  import Null from './Null.svelte';
  import Default from './Default.svelte';

  type Value = $$Generic;

  export let value: Value | null | undefined;
  export let formatValue: CellValueFormatter<Value> = (v) => String(v);

  $: formattedValue = formatValue(value);
</script>

{#if value === null}
  <Null />
{:else if value === undefined}
  <Default />
{:else if typeof value !== 'undefined'}
  <slot {formattedValue}>
    {formattedValue}
  </slot>
{/if}
