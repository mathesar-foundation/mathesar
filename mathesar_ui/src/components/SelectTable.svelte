<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { SelectProps } from '@mathesar-component-library/types';
  import type { TableEntry } from '@mathesar/api/tables';

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
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  {autoSelect}
  bind:value={table}
  on:change
/>
