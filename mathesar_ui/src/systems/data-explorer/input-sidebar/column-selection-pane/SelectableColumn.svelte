<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Badge, Tooltip } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { labeledCountWithoutUnit } from '@mathesar/utils/languageUtils';
  import type { ColumnWithLink } from '../../utils';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithLink;
  export let usageCount = 0;
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
      {#if usageCount > 0}
        <Tooltip>
          <Badge slot="trigger">
            {usageCount}
          </Badge>
          <svelte:fragment slot="content">
            This column has been added {labeledCountWithoutUnit(usageCount)}
          </svelte:fragment>
        </Tooltip>
      {/if}
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
      --badge-background-color: var(--slate-200);
      --badge-text-color: var(--slate-800);
      --badge-padding: 0 0.45rem;
      --badge-border-radius: var(--border-radius-l);
      --badge-font-size: var(--text-size-small);
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
