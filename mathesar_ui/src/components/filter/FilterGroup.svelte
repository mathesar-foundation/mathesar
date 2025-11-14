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
  import { Select } from '@mathesar-component-library';

  import Filter from './Filter.svelte';
  import FilterGroupActions from './FilterGroupActions.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
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

  function remove(filter: IndividualFilter<T> | FilterGroup<T>) {
    args = args.filter((f) => f !== filter);
    dispatch('update');
  }
</script>

<div
  class="filter-group"
  class:top-level={level === 0}
  class:empty={!args.length}
>
  {#if args.length > 0 && level > 0}
    <FilterGroupActions
      {level}
      {columns}
      {getColumnConstraintType}
      bind:operator
      bind:args
      on:update
    >
      <span slot="text">
        {#if operator === 'and'}
          {$_('all_of_the_following_are_true')}
        {:else}
          {$_('any_of_the_following_are_true')}
        {/if}
      </span>
      <slot />
    </FilterGroupActions>
  {/if}

  {#if !args.length}
    <slot name="empty" />
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
    {:else}
      {#if level > 0}
        <FilterGroupActions
          {level}
          {columns}
          {getColumnConstraintType}
          bind:operator
          bind:args
          on:update
        >
          <div class="empty-group-text" slot="text">
            {$_('drag_filter_items_here')}
          </div>
          <slot />
        </FilterGroupActions>
      {/if}
    {/each}
  </div>
  {#if level === 0}
    <FilterGroupActions
      showTextInButtons
      {level}
      {columns}
      {getColumnConstraintType}
      bind:operator
      bind:args
      on:update
    >
      <slot />
    </FilterGroupActions>
  {/if}
</div>

<style lang="scss">
  .filter-group {
    border-radius: var(--border-radius-m);
    gap: var(--sm3);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &:not(.top-level) {
      border: 1px solid var(--color-border-raised-1);
      background: var(--color-navigation-5);
      padding: var(--sm1);
    }

    &:not(.empty):not(.top-level) > .group {
      padding-right: 1rem;
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: var(--sm2);
      overflow: hidden;

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
          flex-grow: 1;
        }
      }
    }

    .empty-group-text {
      width: 100%;
      min-width: 20rem;
    }
  }
  :global([data-ghost]) {
    .prefix {
      visibility: hidden;
    }
  }
</style>
