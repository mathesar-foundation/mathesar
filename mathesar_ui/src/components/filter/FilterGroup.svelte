<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import {
    dndDragHandle,
    dndDraggable,
    dndDroppable,
  } from '@mathesar/components/drag-and-drop/dnd';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconFilterGroup, iconGrip } from '@mathesar/icons';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Icon, Select } from '@mathesar-component-library';

  import Filter from './Filter.svelte';
  import FilterGroupActions from './FilterGroupActions.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
  } from './utils';

  interface $$Events {
    update: void;
  }

  const dispatch = createEventDispatcher<$$Events>();
  const filterOperators = ['and', 'or'] as const;

  export let columns: ReadableMapLike<
    FilterEntryColumn['id'],
    FilterEntryColumn
  >;
  export let getColumnLabel: (column: FilterEntryColumn) => string;
  export let getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined = () => undefined;

  export let level = 0;
  export let filterGroup: FilterGroup;
  $: ({ operator, args } = filterGroup);

  export let recordSummaries: AssociatedCellData<string>;

  function remove(filter: IndividualFilter | FilterGroup) {
    filterGroup.removeArgument(filter);
    dispatch('update');
  }
</script>

<div
  class="filter-group"
  class:top-level={level === 0}
  class:empty={!$args.length}
  class:single-filter={$args.length === 1}
  class:or-connect={$operator === 'or'}
>
  <div class="connecting-line"></div>
  <div class="filter-group-content">
    <div class="group-header">
      <div class="group-icon">
        <Icon {...iconFilterGroup} />
      </div>
      <RichText
        text={$operator === 'or'
          ? $_('where_condition_is_true')
          : $_('where_conditions_are_true')}
        let:slotName
      >
        {#if slotName === 'condition'}
          <span class="operator-selection">
            <Select
              triggerAppearance="secondary"
              options={filterOperators}
              bind:value={$operator}
              on:change={() => dispatch('update')}
              let:option
            >
              <span>
                <RichText
                  text={option === 'or'
                    ? $_('any_of_the_following')
                    : $_('all_of_the_following')}
                  let:slotName={innerSlotName}
                  let:translatedArg
                >
                  {#if innerSlotName === 'bold'}
                    <strong>{translatedArg}</strong>
                  {/if}
                </RichText>
              </span>
            </Select>
          </span>
        {/if}
      </RichText>
      <div class="clear-group">
        <slot />
      </div>
    </div>

    {#if !$args.length}
      <slot name="empty" />
    {/if}

    <div
      class="group-container"
      use:dndDroppable={{ getItem: () => filterGroup }}
    >
      {#each $args as innerFilter, index (innerFilter)}
        <div
          class="filter"
          use:dndDraggable={{
            getItem: () => innerFilter,
          }}
        >
          {#if innerFilter.type === 'group'}
            <div class="horizontal-connecting-line"></div>
          {/if}
          {#if index > 0}
            <div class="prefix">
              {$operator}
            </div>
          {/if}
          <div class="handle" use:dndDragHandle>
            <Icon {...iconGrip} />
          </div>
          <div class="inner-filter">
            <Filter
              {columns}
              {getColumnLabel}
              {getColumnConstraintType}
              {recordSummaries}
              level={level + 1}
              filter={innerFilter}
              on:update
              on:remove={() => remove(innerFilter)}
            />
          </div>
        </div>
      {:else}
        {#if level > 0}
          <div class="empty-group-text">
            {$_('add_or_drag_filter_items_here')}
          </div>
        {/if}
      {/each}
    </div>
    <FilterGroupActions
      {level}
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      {filterGroup}
      on:update
    />
  </div>
</div>

<style lang="scss">
  .filter-group {
    position: relative;
    flex-grow: 1;
    --connecting-line-border-style: solid;
    --connecting-line-color: var(--color-fg-subtle-2);
    --prefix-handle-background: var(
      --filter-group-row-background,
      var(--color-bg-raised-3)
    );

    &.or-connect {
      --connecting-line-border-style: dashed;
    }

    .connecting-line {
      position: absolute;
      top: 2em;
      bottom: 1em;
      left: 0.5em;
      width: 1em;
      border-left: 1px var(--connecting-line-border-style)
        var(--connecting-line-color);
      border-bottom: 1px var(--connecting-line-border-style)
        var(--connecting-line-color);
      border-radius: 0 0 0 var(--border-radius-m);
    }

    .filter-group-content {
      gap: var(--lg1);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .handle {
      cursor: grab;
      color: var(--color-fg-subtle-2);
      margin-top: 4px;
      background: var(--prefix-handle-background);
    }

    .group-header {
      margin-left: 1.4rem;
      display: flex;
      align-items: center;
      gap: var(--sm5);
      position: relative;

      .group-icon {
        position: absolute;
        left: -1.4rem;
      }

      .clear-group {
        margin-left: auto;
      }
    }

    &:not(.top-level) {
      margin: var(--sm4) 0 var(--sm3) var(--sm3);
    }

    .group-container {
      display: flex;
      flex-direction: column;
      gap: var(--lg1);
      min-height: 1.6rem;
    }

    .empty-group-text {
      margin-left: 1.4rem;
      flex-grow: 1;
      padding: 0 var(--sm5);
      color: var(--color-fg-subtle-2);
    }
  }
  :global([data-dnd-ghost]) {
    .prefix,
    :global(.remove) {
      visibility: hidden;
    }
  }

  :global([data-dnd-placeholder]) {
    margin-left: 1.4rem;
  }

  :global(.filter-row.group) {
    --filter-group-row-background: var(--color-bg-raised-1);

    :global(.filter-row.group) {
      --filter-group-row-background: var(--color-bg-base);
    }
  }

  .filter {
    display: flex;
    flex-direction: row;
    gap: var(--sm2);
    align-items: start;
    position: relative;

    .horizontal-connecting-line {
      position: absolute;
      left: 1.2em;
      top: 1em;
      width: 1em;
      height: 1px;
      border-bottom: 1px var(--connecting-line-border-style)
        var(--connecting-line-color);
    }

    .prefix {
      background: var(--prefix-handle-background);
      font-size: var(--sm2);
      color: var(--color-fg-subtle-2);
      border-radius: var(--border-radius-m);
      position: absolute;
      top: 0;
      left: 0.5rem;
      transform: translate(-50%, -100%);
    }

    .inner-filter {
      flex-grow: 1;
    }
  }
</style>
