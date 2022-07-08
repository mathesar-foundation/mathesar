<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables/tableList';

  export let tables: TableEntry[];
  export let table: TableEntry | undefined = undefined;
  export let prependBlank = false;

  $: tableList = prependBlank ? [undefined, ...tables] : tables;
</script>

<Select
  options={tableList}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value={table}
  on:change
/>
