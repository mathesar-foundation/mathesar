<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import {
    SortDirection,
    getDirectionLabel,
  } from '@mathesar/stores/table-data';

  export let value: SortDirection;
  export let onChange: (value: SortDirection) => void = () => {};
</script>

<Select
  options={Object.values(SortDirection)}
  getLabel={getDirectionLabel}
  bind:value
  on:change={(e) => onChange(e.detail ?? SortDirection.A)}
/>
