<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { ColumnWithLink } from '../QueryManager';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithLink;
</script>

<div class="selectable-column">
  <Button appearance="plain" on:click={() => dispatch('add', column)}>
    <ColumnName
      column={{ ...column, type_options: null, display_options: null }}
    />
    <span class="add">Add +</span>
  </Button>
</div>

<style lang="scss">
  div.selectable-column {
    display: flex;
    align-items: center;

    :global(button) {
      flex-grow: 1;
      text-align: left;
      border: 1px solid #efefef;
      border-radius: 0.15rem;
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
      :global(button .add) {
        display: none;
      }
    }

    + :global(.selectable-column) {
      margin-top: -1px;
    }
  }
</style>
