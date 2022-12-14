<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { SelectProps } from '@mathesar-component-library/types';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import TableName from './TableName.svelte';

  type $$Events = Select<TableEntry | undefined>['$$events_def'];

  export let tables: TableEntry[];
  export let value: TableEntry | undefined = undefined;
  /** TODO: Discuss, do we need prependBlank? */
  export let prependBlank = false;
  export let autoSelect: SelectProps<TableEntry | undefined>['autoSelect'] =
    'first';

  $: tableList = prependBlank ? [undefined, ...tables] : tables;
</script>

<Select
  options={tableList}
  valuesAreEqual={(a, b) => a?.id === b?.id}
  {autoSelect}
  bind:value
  on:change
  let:option
>
  {#if option}
    <TableName table={option} />
  {:else if !prependBlank}
    <span class="placeholder">
      <TableName table={{ name: 'Select Table' }} />
    </span>
  {/if}
</Select>

<style lang="scss">
  .placeholder {
    display: inherit;
    --icon-color: var(--slate-400);
    --name-color: var(--slate-400);
  }
</style>
