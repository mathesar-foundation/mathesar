<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { Column } from '@mathesar/stores/table-data/types';

  export let columns: Column[];
  export let column: Column | undefined;
</script>

<Select
  options={columns}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value={column}
/>
