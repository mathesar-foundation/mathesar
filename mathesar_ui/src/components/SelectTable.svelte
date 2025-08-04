<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Table } from '@mathesar/models/Table';
  import { Select } from '@mathesar-component-library';
  import type { SelectProps } from '@mathesar-component-library/types';

  import TableName from './TableName.svelte';

  type $$Events = Select<Table | undefined>['$$events_def'];

  export let tables: Table[];
  export let value: Table | undefined = undefined;
  /** TODO: Discuss, do we need prependBlank? */
  export let prependBlank = false;
  export let autoSelect: SelectProps<Table | undefined>['autoSelect'] = 'first';
  export let disabled = false;

  $: tableList = prependBlank ? [undefined, ...tables] : tables;
</script>

<Select
  options={tableList}
  valuesAreEqual={(a, b) => a?.oid === b?.oid}
  {autoSelect}
  {disabled}
  bind:value
  on:change
  let:option
>
  {#if option}
    <TableName table={option} />
  {:else if !prependBlank}
    <span class="placeholder">
      <TableName table={{ name: $_('select_table') }} />
    </span>
  {/if}
</Select>

<style lang="scss">
  .placeholder {
    display: inherit;
    --icon-color: var(--text-token);
    --name-color: var(--text-token);
  }
</style>
