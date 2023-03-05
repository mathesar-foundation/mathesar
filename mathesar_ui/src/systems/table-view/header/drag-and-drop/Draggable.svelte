<script lang="ts">
  import type { ProcessedColumn, TabularDataSelection } from "@mathesar/stores/table-data";

  export let selection: TabularDataSelection;
  export let selectionInProgress = true;
  export let column: ProcessedColumn;

  $: draggable = !selectionInProgress && selection && selection.isCompleteColumnSelected(column);
</script>

<div
  on:dragstart
  class="draggable"
  class:draggable_active={draggable}
  {draggable}
>
  <slot />
</div>

<style lang="scss">
  .draggable {
    height: 100%;
    width: 100%;
  }
  .draggable_active > :global(div) {
    cursor: grab;
  }
</style>
