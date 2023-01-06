<script lang="ts">
  // Needs to be a counter because dragEnter and dragLeave are fired for child elements
  let isDraggedOverCounter = 0;

  function dragEnter(e: DragEvent) {
    e.preventDefault();
    isDraggedOverCounter += 1;
  }

  function dragLeave() {
    isDraggedOverCounter -= 1;
  }
</script>

<div
  class="droppable"
  class:dragged_over={isDraggedOverCounter}
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
  }
  .droppable.dragged_over > :global(div) {
    border-right: 1px solid blue !important;
  }
</style>
