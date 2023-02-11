<script lang="ts">
  export let locationOfFirstDraggedColumn: number | undefined;
  export let columnLocation: number;

  $: columnLocationDifference =
    locationOfFirstDraggedColumn !== undefined
      ? locationOfFirstDraggedColumn - columnLocation
      : 0;
  $: draggedOverRight = columnLocationDifference < 0;
  $: draggedOverLeft = columnLocationDifference > 0;
  // Needs to be a counter because dragEnter and dragLeave are fired for child elements

  function dragEnter(e: DragEvent) {
    e.preventDefault();
    isDraggedOverCounter += 1;
  }

  function dragLeave() {
    isDraggedOverCounter -= 1;
  }

  function shouldReset(
    locationOfFirstDraggedColumnParam: number | undefined,
  ): number {
    if (locationOfFirstDraggedColumnParam === undefined) {
      return 0;
    }
    return isDraggedOverCounter;
  }

  $: isDraggedOverCounter = shouldReset(locationOfFirstDraggedColumn);

</script>

<div
  class="droppable"
  class:dragged_over={isDraggedOverCounter}
  class:dragged_over_right={draggedOverRight}
  class:dragged_over_left={draggedOverLeft}
  on:drop
  on:dragover={(e) => e.preventDefault()}
  on:dragenter={(e) => dragEnter(e)}
  on:dragleave={() => dragLeave()}
>
  <slot class="drag-over" />
</div>

<style lang="scss">
  .droppable {
    height: 100%;
    width: 100%;
  }
  .droppable.dragged_over.dragged_over_left > :global(div) {
    border-left: 0.2rem solid var(--sky-700) !important;
  }
  .droppable.dragged_over.dragged_over_right > :global(div) {
    border-right: 0.2rem solid var(--sky-700) !important;
  }
</style>
