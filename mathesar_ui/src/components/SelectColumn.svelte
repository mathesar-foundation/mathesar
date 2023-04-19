<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import ColumnName from './column/ColumnName.svelte';

  // Additional classes
  let classes = '';
  export { classes as class };

  export let columns: Column[];
  export let value: Column | undefined = undefined;
  export let disabled = false;
</script>

<Select
  options={columns}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value
  {disabled}
  class={classes}
  on:change
  let:option
>
  {#if option}
    <ColumnName column={option} />
  {/if}
</Select>
