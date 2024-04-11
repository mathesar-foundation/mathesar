<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';

  export let selection: Writable<SheetSelection>;
  export let column: ProcessedColumn;

  $: draggable = $selection.fullySelectedColumnIds.has(String(column.id));

  function handleMouseDown(event: MouseEvent) {
    if (draggable) {
      event.stopPropagation();
    }
  }
</script>

<div
  on:dragstart
  on:mousedown={handleMouseDown}
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
