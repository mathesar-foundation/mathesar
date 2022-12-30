<script lang="ts">
    //Needs to be a counter because dragEnter and dragLeave are fired for child elements
    let isDraggedOverCounter = 0;

    function dragEnter(e: DragEvent) {
        e.preventDefault();
        isDraggedOverCounter++;
    }

    function dragLeave(e: DragEvent) {
        isDraggedOverCounter--;
    }
</script>

<div 
    class="droppable"
    class:dragged_over={isDraggedOverCounter}
    on:drop
    on:dragover={(e) => {e.preventDefault()}}
    on:dragenter={(e) => dragEnter(e)}
    on:dragleave={(e) => dragLeave(e)}>
    <slot class="drag-over"></slot>
</div>

<style lang="scss">
    .droppable {
        height: 100%;
    }
    .droppable.dragged_over > :global(div) {
        border-right: 1px solid blue !important;
    }
</style>
  