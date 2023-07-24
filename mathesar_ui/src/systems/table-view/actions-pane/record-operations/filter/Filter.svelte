<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount, tick } from 'svelte';
  import { writable, type Writable } from 'svelte/store';

  import { Button, Icon } from '@mathesar-component-library';
  import type { FilterCombination } from '@mathesar/api/types/tables/records';
  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordUtils';
  import { validateFilterEntry } from '@mathesar/components/filter-entry';
  import { FILTER_INPUT_CLASS } from '@mathesar/components/filter-entry/utils';
  import { iconAddNew } from '@mathesar/icons';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    getTabularDataStoreFromContext,
    type Filtering,
  } from '@mathesar/stores/table-data';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import { deepCloneFiltering } from '../utils';
  import FilterEntries from './FilterEntries.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const imperativeFilterController = getImperativeFilterControllerFromContext();

  export let filtering: Writable<Filtering>;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls,
  // since each set call triggers requests.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable(deepCloneFiltering($filtering));

  let element: HTMLElement;

  $: ({ processedColumns } = $tabularData);
  $: filterCount = $internalFiltering.entries.length;

  function checkAndSetExternalFiltering() {
    const validFilters = $internalFiltering.entries.filter((filter) => {
      const column = $processedColumns.get(filter.columnId);
      const condition = column?.allowedFiltersMap.get(filter.conditionId);
      if (condition) {
        return validateFilterEntry(condition, filter.value);
      }
      return false;
    });
    const newFiltering = deepCloneFiltering({
      ...$internalFiltering,
      entries: validFilters,
    });
    if ($filtering.equals(newFiltering)) {
      return;
    }
    filtering.set(newFiltering);
  }

  function addFilter(columnId?: number) {
    const column =
      columnId === undefined
        ? [...$processedColumns.values()][0]
        : $processedColumns.get(columnId);
    if (!column) {
      return;
    }
    const firstCondition = [...column.allowedFiltersMap.values()][0];
    if (!firstCondition) {
      return;
    }
    const newFilter = {
      columnId: column.id,
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

  function activateLastFilterInput() {
    const lastFilterInput = takeLast(
      element.querySelectorAll<HTMLElement | LinkedRecordInputElement>(
        `.${FILTER_INPUT_CLASS}`,
      ),
    );
    if (lastFilterInput) {
      if ('launchRecordSelector' in lastFilterInput) {
        void lastFilterInput.launchRecordSelector();
      } else {
        lastFilterInput.focus();
      }
    }
  }

  onMount(() => imperativeFilterController?.onAddFilter(addFilter));
  onMount(() =>
    imperativeFilterController?.onActivateLastFilterInput(
      activateLastFilterInput,
    ),
  );
</script>

<div class="filters" class:filtered={filterCount} bind:this={element}>
  <div class="header">{$LL.tableViewFilters.filterRecords()}</div>
  <div class="content">
    {#if filterCount}
      <FilterEntries
        bind:entries={$internalFiltering.entries}
        bind:filterCombination={$internalFiltering.combination}
        on:remove={(e) => removeFilter(e.detail)}
        on:update={updateFilter}
        on:updateCombination={(e) => setCombination(e.detail)}
      />
    {:else}
      <span class="muted">{$LL.tableViewFilters.noFiltersHaveBeenAdded()}</span>
    {/if}
  </div>
  {#if $processedColumns.size}
    <div class="footer">
      <Button
        appearance="secondary"
        on:click={async () => {
          addFilter();
          await tick();
          activateLastFilterInput();
        }}
      >
        <Icon {...iconAddNew} />
        <span>{$LL.tableViewFilters.addNewFilter()}</span>
      </Button>
    </div>
  {/if}
</div>

<style lang="scss">
  .filters {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }

    .header {
      font-weight: bolder;
    }

    .muted {
      color: var(--slate-400);
    }
  }
</style>
