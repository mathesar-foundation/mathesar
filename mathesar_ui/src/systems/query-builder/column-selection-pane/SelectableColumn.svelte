<script lang="ts">
  import type { ColumnWithLink } from './selectionPaneUtils';

  export let column: ColumnWithLink;
</script>

<div>
  {column.name}
</div>

<style lang="scss">
  div {
    padding: 0.5rem 0.75rem;
    border: 1px dashed #dfdfdf;
    border-radius: 2px;
    margin: 0.7rem 0;
  }
</style>
