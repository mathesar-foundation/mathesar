<script lang="ts">
  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';

  import FilterActions from './FilterActions.svelte';
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
    >
      <FilterActions on:remove />
    </FilterEntry>
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
    >
      <FilterActions on:remove />
    </FilterGroupComponent>
  {/if}
</div>
