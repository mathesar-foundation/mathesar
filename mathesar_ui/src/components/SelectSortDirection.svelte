<script lang="ts">
  import { SimpleSelect } from '@mathesar-component-library';
  import {
    SortDirection,
    getDirectionLabel,
  } from '@mathesar/stores/table-data';

  export let value: SortDirection;
  export let onChange: (value: SortDirection) => void = () => {};
</script>

<SimpleSelect
  values={Object.values(SortDirection)}
  getLabel={getDirectionLabel}
  bind:value
  {onChange}
/>
