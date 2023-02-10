<script lang="ts">
  export let isSelected = false;
  export let selectionInProgress = true;

  $: draggable = isSelected && !selectionInProgress;
</script>

<div
  on:dragstart
  class="draggable"
  class:draggable_active={draggable}
  draggable={draggable}>
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
