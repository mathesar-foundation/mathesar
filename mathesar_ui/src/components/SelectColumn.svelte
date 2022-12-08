<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';

  // Additional classes
  let classes = '';
  export { classes as class };

  export let columns: Column[];
  export let column: Column | undefined;
  export let disabled = false;
</script>

<Select
  options={columns}
  labelKey="name"
  valuesAreEqual={(a, b) => a?.id === b?.id}
  bind:value={column}
  {disabled}
  class={classes}
  on:change
/>
