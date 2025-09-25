<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, InputGroupText, Select } from '@mathesar-component-library';

  import FilterEntry from './FilterEntry.svelte';
  import {
    type FilterEntryColumn,
    FilterGroup,
    makeIndividualFilter,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumn<T>;

  const dispatch = createEventDispatcher();

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column: ColumnLikeType) => string;
  export let getColumnConstraintType: (
    column: ColumnLikeType,
  ) => ConstraintType[] | undefined = () => undefined;

  export let filterGroup: FilterGroup<T>;
  export let recordSummaries: AssociatedCellData<string>;
  export let numberOfFilters = 1;

  function addFilter() {
    const filter = makeIndividualFilter(columns);
    if (filter) {
      filterGroup = filterGroup.withFilter(filter);
      dispatch('update');
    }
  }

  function addFilterGroup() {
    const filter = makeIndividualFilter(columns);
    filterGroup = filterGroup.withFilter(
      new FilterGroup({
        operator: 'and',
        args: filter ? [filter] : [],
      }),
    );
    dispatch('update');
  }
</script>

<div class="filter-group">
  {#each filterGroup.args as innerFilter, index (innerFilter)}
    <div class="prefix">
      {#if index === 0}
        <InputGroupText>{$_('where')}</InputGroupText>
      {:else if index === 1 && filterGroup.args.length > 1}
        <Select
          options={['and', 'or']}
          bind:value={filterGroup.operator}
          on:change={() => dispatch('update')}
        />
      {:else if filterGroup.args.length > 1}
        <InputGroupText>{filterGroup.operator}</InputGroupText>
      {/if}
    </div>
    {#if 'operator' in innerFilter}
      <svelte:self
        {columns}
        {getColumnLabel}
        {getColumnConstraintType}
        bind:filterGroup={innerFilter}
        {recordSummaries}
        {numberOfFilters}
        on:update
      />
    {:else}
      <FilterEntry
        {columns}
        {getColumnLabel}
        {getColumnConstraintType}
        bind:columnIdentifier={innerFilter.columnId}
        bind:conditionIdentifier={innerFilter.conditionId}
        bind:value={innerFilter.value}
        recordSummaryStore={recordSummaries}
        {numberOfFilters}
        on:removeFilter={() => dispatch('remove')}
        on:update
      />
    {/if}
  {/each}
  <div class="footer">
    <Button appearance="secondary" on:click={addFilter}>
      {$_('add_new_filter')}
    </Button>

    <Button appearance="secondary" on:click={addFilterGroup}>
      {$_('add_filter_group')}
    </Button>
  </div>
</div>

<style lang="scss">
  .filter-group {
    border: 1px solid var(--color-border-raised-1);
  }
</style>
