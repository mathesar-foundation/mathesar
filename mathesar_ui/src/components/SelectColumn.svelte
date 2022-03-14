<script lang="ts">
  import { SimpleSelect } from '@mathesar-component-library';
  import type { Column } from '@mathesar/stores/table-data/types';

  export let columns: Column[];
  export let column: Column;
  export let onChange: (column: Column) => void = () => {};
</script>

<SimpleSelect
  values={columns}
  getLabel={(c) => c.name}
  valuesAreEqual={(a, b) => a.id === b.id}
  bind:value={column}
  {onChange}
/>
