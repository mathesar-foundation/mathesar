<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { Button } from '@mathesar-component-library';
  import type { Filtering } from '@mathesar/stores/table-data';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/api/tables/records';
  import FilterEntries from './FilterEntries.svelte';
  import { validateFilterEntry, deepCloneFiltering } from './utils';

  const tabularData = getTabularDataStoreFromContext();

  export let filtering: Writable<Filtering>;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable(deepCloneFiltering($filtering));

  $: ({ processedColumns } = $tabularData);
  $: filterCount = $internalFiltering.entries.length;

  function checkAndSetExternalFiltering() {
    const isValid = $internalFiltering.entries.every((filter) => {
      const column = $processedColumns.get(filter.columnId);
      const condition = column?.allowedFiltersMap.get(filter.conditionId);
      if (condition) {
        return validateFilterEntry(condition, filter.value);
      }
      return false;
    });
    if (isValid) {
      filtering.set(deepCloneFiltering($internalFiltering));
    }
  }

  function addFilter() {
    const firstColumn = [...$processedColumns.values()][0];
    if (!firstColumn) {
      return;
    }
    const firstCondition = [...firstColumn.allowedFiltersMap.values()][0];
    if (!firstCondition) {
      return;
    }
    const newFilter = {
      columnId: firstColumn.column.id,
      conditionId: firstCondition.id,
      value: undefined,
      isValid: validateFilterEntry(firstCondition, undefined),
    };
    internalFiltering.update((f) => f.withEntry(newFilter));
    checkAndSetExternalFiltering();
  }

  function removeFilter(index: number) {
    internalFiltering.update((f) => f.withoutEntry(index));
    checkAndSetExternalFiltering();
  }

  function setCombination(combination: FilterCombination) {
    internalFiltering.update((f) => f.withCombination(combination));
    checkAndSetExternalFiltering();
  }

  function updateFilter() {
    checkAndSetExternalFiltering();
  }
</script>

<div class="filters" class:filtered={filterCount}>
  <div class="header">
    {#if filterCount}
      Filter records
    {:else}
      No filters have been added
    {/if}
  </div>
  <div class="content">
    <FilterEntries
      bind:entries={$internalFiltering.entries}
      bind:filterCombination={$internalFiltering.combination}
      on:remove={(e) => removeFilter(e.detail)}
      on:update={updateFilter}
      on:updateCombination={(e) => setCombination(e.detail)}
    />

    {#if $processedColumns.size}
      <div class="footer">
        <Button on:click={addFilter}>Add new filter</Button>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .filters {
    padding: 12px;
    min-width: 310px;

    &.filtered {
      min-width: 620px;
    }
    &:not(.filtered) {
      .header {
        color: #606066;
      }
    }

    .content {
      margin-top: 12px;

      .footer {
        display: flex;
        align-items: center;
        margin-top: 18px;
      }
    }
  }
</style>
