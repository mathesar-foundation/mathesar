<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import {
    dndDraggable,
    dndDroppable,
  } from '@mathesar/components/drag-and-drop/dnd';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, Select } from '@mathesar-component-library';

  import Filter from './Filter.svelte';
  import {
    type FilterEntryColumn,
    FilterGroup,
    type IndividualFilter,
    makeIndividualFilter,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumn<T>;
  interface $$Events {
    update: void;
  }

  const dispatch = createEventDispatcher<$$Events>();
  const filterOperators = ['and', 'or'] as const;

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column: ColumnLikeType) => string;
  export let getColumnConstraintType: (
    column: ColumnLikeType,
  ) => ConstraintType[] | undefined = () => undefined;

  export let level = 0;
  export let getFilterGroup: () => FilterGroup<T>;
  export let operator: FilterGroup<T>['operator'];
  export let args: FilterGroup<T>['args'];

  export let recordSummaries: AssociatedCellData<string>;

  function addFilter() {
    const filter = makeIndividualFilter(columns);
    if (filter) {
      args = [...args, filter];
      dispatch('update');
    }
  }

  function addFilterGroup() {
    const filter = makeIndividualFilter(columns);
    args = [
      ...args,
      new FilterGroup({
        operator: operator === 'and' ? 'or' : 'and',
        args: filter ? [filter] : [],
      }),
    ];
    dispatch('update');
  }

  function remove(filter: IndividualFilter<T> | FilterGroup<T>) {
    args = args.filter((f) => f !== filter);
    dispatch('update');
  }
</script>

<div class="filter-group">
  {#if args.length > 0 && level > 0}
    <div>
      {#if operator === 'and'}
        {$_('all_of_the_following_are_true')}
      {:else}
        {$_('any_of_the_following_are_true')}
      {/if}
    </div>
  {/if}
  <div class="group" use:dndDroppable={{ getItem: () => getFilterGroup() }}>
    {#each args as innerFilter, index (innerFilter)}
      <div
        class="filter"
        use:dndDraggable={{
          getItem: () => innerFilter,
        }}
      >
        <div class="prefix">
          {#if index === 0}
            {$_('where')}
          {:else if index === 1 && args.length > 1}
            <Select
              triggerAppearance="action"
              options={filterOperators}
              bind:value={operator}
              on:change={() => dispatch('update')}
            />
          {:else if args.length > 1}
            {operator}
          {/if}
        </div>
        <div class="content">
          <Filter
            {columns}
            {getColumnLabel}
            {getColumnConstraintType}
            {recordSummaries}
            level={level + 1}
            bind:filter={innerFilter}
            on:update
            on:remove={() => remove(innerFilter)}
          />
        </div>
      </div>
    {/each}
  </div>
  <div class="footer">
    <Button appearance="action" on:click={addFilter}>
      {$_('add_new_filter')}
    </Button>

    {#if level < 2}
      <Button appearance="action" on:click={addFilterGroup}>
        {$_('add_filter_group')}
      </Button>
    {/if}
  </div>
</div>

<style lang="scss">
  .filter-group {
    border: 1px solid var(--color-border-raised-1);
    border-radius: var(--border-radius-m);
    padding: var(--sm4);
    gap: var(--sm5);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .group {
      display: flex;
      flex-direction: column;
      gap: var(--sm4);
      overflow: hidden;
      min-height: 20px; // for empty groups - add a default area here

      .filter {
        display: flex;
        flex-direction: row;
        gap: var(--sm4);
        align-items: start;
        overflow: hidden;

        .prefix {
          width: 3.5rem;
          --button-padding: var(--sm6);
          --button-gap: var(--sm6);
        }

        .content {
          overflow: hidden;
        }
      }
    }
  }
  :global([data-ghost]) {
    .prefix {
      visibility: hidden;
    }
  }
</style>
