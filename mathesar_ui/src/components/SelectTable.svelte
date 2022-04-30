<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/AppTypes';

  export let tables: TableEntry[];
  export let table: TableEntry | undefined = undefined;
  export let prependBlank = false;
</script>

<Select
  options={tables}
  {prependBlank}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value={table}
/>
