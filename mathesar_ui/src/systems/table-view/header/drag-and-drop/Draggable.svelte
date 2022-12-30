<script lang="ts">
    export let isSelected = false;
</script>

<div on:dragstart draggable={isSelected}>
    <slot></slot>
</div>
  