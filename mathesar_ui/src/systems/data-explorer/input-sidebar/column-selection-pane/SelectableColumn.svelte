<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { ColumnWithLink } from '../../utils';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithLink;
</script>

<div class="selectable-column">
  <Button on:click={() => dispatch('add', column)}>
    <div class="name">
      <ColumnName
        column={{
          ...column,
          type: column.producesMultipleResults ? '_array' : column.type,
          type_options: column.producesMultipleResults
            ? { item_type: column.type }
            : null,
          display_options: null,
        }}
      />
    </div>
    <span class="add">
      <span class="text">Add</span>
      <span>+</span>
    </span>
  </Button>
</div>

<style lang="scss">
  div.selectable-column {
    display: flex;
    align-items: center;

    :global(button) {
      flex-grow: 1;
      text-align: left;
      overflow: hidden;
    }
    .name {
      flex-grow: 1;
      white-space: nowrap;
      overflow: hidden;
    }
    .add {
      flex-shrink: 0;
    }

    &:not(:hover) {
      .add .text {
        display: none;
      }
    }

    + :global(.selectable-column) {
      margin-top: var(--size-super-ultra-small);
    }

    + :global(.table-group) {
      margin-top: var(--size-small);
    }
  }
</style>
