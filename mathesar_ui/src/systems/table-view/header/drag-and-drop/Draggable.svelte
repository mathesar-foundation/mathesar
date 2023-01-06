<script lang="ts">
  export let isSelected = false;
  export let selectionInProgress = true;
</script>

<div on:dragstart draggable={isSelected && !selectionInProgress}>
  <slot />
</div>
