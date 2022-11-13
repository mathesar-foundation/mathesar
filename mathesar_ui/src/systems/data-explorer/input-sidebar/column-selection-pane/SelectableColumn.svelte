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
    <ColumnName
      column={{ ...column, type_options: null, display_options: null }}
    />
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
    :global(button .name-with-icon) {
      flex-grow: 1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :global(button .add) {
      flex-shrink: 0;
    }

    &:not(:hover) {
      :global(button .add .text) {
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
