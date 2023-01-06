<script lang="ts">
    export let isSelected = false;
    export let selectionInProgress = true;
</script>

<div on:dragstart draggable={isSelected && !selectionInProgress}>
    <div>{isSelected}</div>
    <div>{selectionInProgress}</div>
    <slot></slot>
</div>
  