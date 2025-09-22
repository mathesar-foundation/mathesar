<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount } from 'svelte';
  import { type Writable, writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordUtils';
  import { validateFilterEntry } from '@mathesar/components/filter-entry';
  import { FILTER_INPUT_CLASS } from '@mathesar/components/filter-entry/utils';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import {
    type FilterEntry,
    Filtering,
    type ProcessedColumns,
    defaultFilterCombination,
  } from '@mathesar/stores/table-data';
  import { Button } from '@mathesar-component-library';

  import FilterEntries from './FilterEntries.svelte';

  const imperativeFilterController = getImperativeFilterControllerFromContext();

  export let filtering: Writable<Filtering>;
  export let processedColumns: ProcessedColumns;
  export let recordSummaries: AssociatedCellData<string>;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls,
  // since each set call triggers requests.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable($filtering.clone());

  let element: HTMLElement;

  $: filterCount = $internalFiltering.countAll();
  $: console.log(filterCount);

  function checkAndSetExternalFiltering() {
    const validFilters = $internalFiltering.filterEntries((filter) => {
      const column = processedColumns.get(filter.columnId);
      const condition = column?.allowedFiltersMap.get(filter.conditionId);
      if (condition) {
        return validateFilterEntry(condition, filter.value);
      }
      return false;
    });

    if ($filtering.equals(validFilters)) {
      return;
    }
    filtering.set(validFilters.clone());
  }

  function getNewFilter(): FilterEntry | undefined {
    const pcs = [...processedColumns.values()];
    const filterColumn = pcs.find((pc) => !pc.column.primary_key) ?? pcs[0];
    if (!filterColumn) {
      return;
    }
    const firstCondition = [...filterColumn.allowedFiltersMap.values()][0];
    if (!firstCondition) {
      return;
    }
    // eslint-disable-next-line consistent-return
    return {
      columnId: filterColumn.id,
      conditionId: firstCondition.id,
      value: undefined,
    };
  }

  function addFilter() {
    const newFilter = getNewFilter();
    if (!newFilter) {
      return;
    }
    internalFiltering.update((f) => f.withEntry(newFilter));
    checkAndSetExternalFiltering();
  }

  function addFilterGroup() {
    const newFilter = getNewFilter();
    if (!newFilter) {
      return;
    }
    internalFiltering.update((f) =>
      f.withEntry(
        new Filtering({
          combination: defaultFilterCombination,
          entries: [newFilter],
        }),
      ),
    );
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

  // TODO_FILTERING: Fix broken imperative filter controls
  onMount(() => imperativeFilterController?.onAddFilter((columnId) => {}));
  onMount(() =>
    imperativeFilterController?.onActivateLastFilterInput(
      activateLastFilterInput,
    ),
  );
</script>

<div class="filters" class:filtered={filterCount} bind:this={element}>
  <div class="header">{$_('filter_records')}</div>
  <div class="content">
    {#if filterCount}
      <FilterEntries
        {processedColumns}
        {recordSummaries}
        bind:filter={$internalFiltering}
        on:update={updateFilter}
      />
    {:else}
      <span class="muted">{$_('no_filters_added')}</span>
    {/if}
  </div>
  {#if processedColumns.size}
    <div class="footer">
      <Button appearance="secondary" on:click={addFilter}>
        {$_('add_new_filter')}
      </Button>

      <Button appearance="secondary" on:click={addFilterGroup}>
        {$_('add_filter_group')}
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
      color: var(--color-fg-base-disabled);
    }
  }
</style>
