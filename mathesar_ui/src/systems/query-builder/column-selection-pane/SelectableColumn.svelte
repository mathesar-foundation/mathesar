<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '@mathesar-component-library';
  import type { ColumnWithLink } from '../InputColumnsManager';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithLink;
</script>

<div class="selectable-column">
  <div>{column.name}</div>
  <Button appearance="plain" on:click={() => dispatch('add', column)}>+</Button>
</div>

<style lang="scss">
  div.selectable-column {
    border: 1px dashed #dfdfdf;
    border-radius: 2px;
    margin: 0.7rem 0;
    display: flex;
    align-items: center;
    height: 2.4rem;

    > div {
      padding: 0.5rem 0.75rem;
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :global(button) {
      border-left: 1px solid #dfdfdf;
    }

    // Figure out interaction for touch devices
    &:not(:hover) {
      :global(button) {
        display: none;
      }
    }
  }
</style>
