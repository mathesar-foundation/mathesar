<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { type Writable, writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import DropdownMenu from '@mathesar/component-library/dropdown-menu/DropdownMenu.svelte';
  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordUtils';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { validateFilterEntry } from '@mathesar/components/filter-entry';
  import FilterEntry from '@mathesar/components/filter-entry/FilterEntry.svelte';
  import { FILTER_INPUT_CLASS } from '@mathesar/components/filter-entry/utils';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    type Filtering,
    type ProcessedColumns,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/stores/table-data/filtering';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { ButtonMenuItem } from '@mathesar-component-library';

  import { deepCloneFiltering } from '../utils';

  const imperativeFilterController = getImperativeFilterControllerFromContext();

  export let filtering: Writable<Filtering>;
  export let processedColumns: ProcessedColumns;
  export let recordSummaries: RecordSummaryStore;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls,
  // since each set call triggers requests.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable(deepCloneFiltering($filtering));

  let element: HTMLElement;

  $: filterCount = $internalFiltering.entries.length;
  // $: availableColumns =  processedColumns.values().toArray()

  const tabularData = getTabularDataStoreFromContext();
  const processedColumnStore = $tabularData.processedColumns;
  /** Columns which are not already used as a filtering entry */
  $: availableColumns = [...$processedColumnStore.values()].filter(
    (column) => !$internalFiltering.hasColumn(column.id),
  );

  function checkAndSetExternalFiltering() {
    const validFilters = $internalFiltering.entries.filter((filter) => {
      const column = processedColumns.get(filter.columnId);
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
        ? [...processedColumns.values()][0]
        : processedColumns.get(columnId);
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

  // This code has been commented due to not being used in current code. But may be used in the future.
  // function setCombination(combination: FilterCombination) {
  //   internalFiltering.update((f) => f.withCombination(combination));
  //   checkAndSetExternalFiltering();
  // }

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

  const dispatch = createEventDispatcher<{
    remove: number;
    update: number;
    updateCombination: FilterCombination;
  }>();
</script>

<div class="filters" class:filtered={filterCount} bind:this={element}>
  <div class="header">{$_('filter_records')}</div>
  <div class="content">
    {#if filterCount}
      {#each $internalFiltering.entries as entry, index}
        <FilterEntry
          columns={processedColumns}
          getColumnLabel={(column) =>
            processedColumns.get(column.id)?.column.name ?? ''}
          disableColumnChange
          getColumnConstraintType={(column) =>
            getColumnConstraintTypeByColumnId(column.id, processedColumns)}
          bind:columnIdentifier={entry.columnId}
          bind:conditionIdentifier={entry.conditionId}
          bind:value={entry.value}
          numberOfFilters={filterCount}
          on:update={() => {
            updateFilter();
            dispatch('update');
          }}
          on:removeFilter={() => {
            removeFilter(index);
            dispatch('remove');
          }}
          recordSummaryStore={recordSummaries}
        />
      {/each}
    {:else}
      <span class="muted">{$_('no_filters_added')}</span>
    {/if}
  </div>
  <div class="footer">
    <DropdownMenu
      label={$_('add_new_filter')}
      disabled={!availableColumns}
      triggerAppearance="secondary"
    >
      {#each availableColumns as column (column.id)}
        <ButtonMenuItem
          on:click={async () => {
            addFilter(column.id);
            await tick();
            activateLastFilterInput();
          }}
        >
          <ColumnName
            column={{
              name: processedColumns.get(column.id)?.column.name ?? '',
              type: processedColumns.get(column.id)?.column.type ?? '',
              type_options:
                processedColumns.get(column.id)?.column.type_options ?? null,
              constraintsType: getColumnConstraintTypeByColumnId(
                column.id,
                processedColumns,
              ),
            }}
          />
        </ButtonMenuItem>
      {/each}
    </DropdownMenu>
  </div>
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

    .footer {
      margin-top: 1rem;
    }

    .muted {
      color: var(--slate-400);
    }
  }
</style>
