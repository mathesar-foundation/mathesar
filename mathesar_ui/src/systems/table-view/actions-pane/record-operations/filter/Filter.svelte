<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount, tick } from 'svelte';
  import { type Writable, writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordUtils';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { validateFilterEntry } from '@mathesar/components/filter-entry';
  import { FILTER_INPUT_CLASS } from '@mathesar/components/filter-entry/utils';
  import { iconAddNew } from '@mathesar/icons';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import type {
    Filtering,
    ProcessedColumns,
  } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/stores/table-data/filtering';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';

  import { deepCloneFiltering } from '../utils';

  import FilterEntries from './FilterEntries.svelte';

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

  function addFilter(columnId: number) {
    const column = processedColumns.get(columnId);
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
  <div class="header">{$_('filter_records')}</div>
  <div class="content">
    {#if filterCount}
      <FilterEntries
        {processedColumns}
        {recordSummaries}
        bind:entries={$internalFiltering.entries}
        bind:filterCombination={$internalFiltering.combination}
        on:remove={(e) => removeFilter(e.detail)}
        on:update={updateFilter}
        on:updateCombination={(e) => setCombination(e.detail)}
      />
    {:else}
      <span class="muted">{$_('no_filters_added')}</span>
    {/if}
  </div>
  {#if processedColumns.size}
    <div class="footer">
      <DropdownMenu
        icon={iconAddNew}
        label={$_('add_new_filter')}
        disabled={processedColumns.size === 0}
        triggerAppearance="secondary"
      >
        {#each [...processedColumns.values()] as column (column.id)}
          <ButtonMenuItem
            on:click={async () => {
              addFilter(column.id);
              await tick();
              activateLastFilterInput();
            }}
          >
            <ProcessedColumnName processedColumn={column} />
          </ButtonMenuItem>
        {/each}
      </DropdownMenu>
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
      color: var(--gray-400);
    }
  }
</style>
