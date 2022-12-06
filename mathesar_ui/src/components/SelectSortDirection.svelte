<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import {
    SortDirection,
    getDirectionLabel,
  } from '@mathesar/stores/table-data';

  // Additional classes
  let classes = '';
  export { classes as class };

  export let value: SortDirection;
  export let onChange: (value: SortDirection) => void = () => {};
</script>

<Select
  options={Object.values(SortDirection)}
  getLabel={getDirectionLabel}
  class={classes}
  bind:value
  on:change={(e) => onChange(e.detail ?? SortDirection.A)}
/>
