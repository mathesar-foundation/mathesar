<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import { dndDragHandle } from '@mathesar/components/drag-and-drop/dnd';
  import { iconDeleteMajor, iconGrip } from '@mathesar/icons';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, Icon } from '@mathesar-component-library';

  import FilterEntry from './FilterEntry.svelte';
  import FilterGroupComponent from './FilterGroup.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumn<T>;

  interface $$Events {
    update: void;
    remove: void;
  }

  const dispatch = createEventDispatcher<$$Events>();

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column: ColumnLikeType) => string;
  export let getColumnConstraintType: (
    column: ColumnLikeType,
  ) => ConstraintType[] | undefined = () => undefined;
  export let recordSummaries: AssociatedCellData<string>;

  export let filter: FilterGroup<T> | IndividualFilter<T>;
  export let level = 0;

  function filterGroupTypeGuard(filterGroup: FilterGroup<T>) {
    return () => filterGroup;
  }
</script>

<div class="filter-row">
  {#if filter.type === 'individual'}
    <FilterEntry
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      recordSummaryStore={recordSummaries}
      bind:columnIdentifier={filter.columnId}
      bind:conditionIdentifier={filter.conditionId}
      bind:value={filter.value}
      on:update
    />
  {:else}
    <FilterGroupComponent
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      {recordSummaries}
      {level}
      getFilterGroup={filterGroupTypeGuard(filter)}
      bind:operator={filter.operator}
      bind:args={filter.args}
      on:update
    />
  {/if}
  <div class="handle" use:dndDragHandle>
    <Icon {...iconGrip} />
  </div>
  <div class="remove">
    <Button appearance="plain" on:click={() => dispatch('remove')}>
      <Icon {...iconDeleteMajor} />
    </Button>
  </div>
</div>

<style lang="scss">
  .filter-row {
    display: flex;
    gap: var(--sm5);
    align-items: start;

    .remove {
      font-size: var(--sm1);
    }
  }
  .handle {
    background: var(--color-bg-raised-2);
    padding-inline: var(--sm5);
    border-radius: var(--border-radius-m);
  }
</style>
