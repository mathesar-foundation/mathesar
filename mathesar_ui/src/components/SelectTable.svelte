<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { SelectProps } from '@mathesar-component-library/types';
  import type { TableEntry } from '@mathesar/api/tables/tableList';

  type $$Events = Select<TableEntry | undefined>['$$events_def'];

  export let tables: TableEntry[];
  export let table: TableEntry | undefined = undefined;
  export let prependBlank = false;
  export let initialSelectionType: SelectProps<
    TableEntry | undefined
  >['initialSelectionType'] = 'first';

  $: tableList = prependBlank ? [undefined, ...tables] : tables;
</script>

<Select
  options={tableList}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  {initialSelectionType}
  bind:value={table}
  on:change
/>
