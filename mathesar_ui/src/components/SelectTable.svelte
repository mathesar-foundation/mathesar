<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { SelectProps } from '@mathesar-component-library/types';
  import type { TableEntry } from '@mathesar/api/tables';
  import TableName from './TableName.svelte';

  type $$Events = Select<TableEntry | undefined>['$$events_def'];

  export let tables: TableEntry[];
  export let table: TableEntry | undefined = undefined;
  export let prependBlank = false;
  export let autoSelect: SelectProps<TableEntry | undefined>['autoSelect'] =
    'first';

  $: tableList = prependBlank ? [undefined, ...tables] : tables;
</script>

<Select
  options={tableList}
  getLabel={(t) => (t ? { component: TableName, props: { table: t } } : '')}
  valuesAreEqual={(a, b) => a?.id === b?.id}
  {autoSelect}
  bind:value={table}
  on:change
/>
