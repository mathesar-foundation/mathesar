<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon } from '@mathesar-component-library';
  import type { Filtering } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/api/tables/records';
  import FilterEntries from './FilterEntries.svelte';
  import type { ProcessedTableColumnMap } from '../../utils';
  import { validateFilterEntry, deepCloneFiltering } from './utils';

  export let filtering: Writable<Filtering>;
  export let processedTableColumnsMap: ProcessedTableColumnMap;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable(deepCloneFiltering($filtering));

  $: filterCount = $internalFiltering.entries.length;

  let isValid = true;

  function checkAndSetExternalFiltering() {
    isValid = $internalFiltering.entries.every((filter) => {
      const column = processedTableColumnsMap.get(filter.columnId);
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
    const firstColumn = [...processedTableColumnsMap.values()][0];
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
    <span>
      {#if filterCount}
        Filter records
      {:else}
        No filters have been added
      {/if}
    </span>
  </div>
  <div class="content">
    <FilterEntries
      entries={$internalFiltering.entries}
      {processedTableColumnsMap}
      on:remove={(e) => removeFilter(e.detail)}
      on:update={updateFilter}
      on:updateCombination={(e) => setCombination(e.detail)}
    />

    {#if processedTableColumnsMap.size}
      <div class="footer">
        <Button on:click={addFilter}>Add new filter</Button>
        {#if !isValid && filterCount > 1}
          <span class="state-info">
            <Icon data={faExclamationCircle} />
            Changes not applied
          </span>
        {/if}
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

    .content {
      margin-top: 12px;

      .footer {
        display: flex;
        align-items: center;
        margin-top: 18px;
        max-width: 560px;

        .state-info {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #576546;
          margin-left: auto;
        }
      }
    }
  }
</style>
