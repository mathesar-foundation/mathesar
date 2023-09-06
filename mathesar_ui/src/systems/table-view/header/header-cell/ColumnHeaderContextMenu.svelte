<script lang="ts">
  import { ButtonMenuItem } from '@mathesar/component-library';
  import {
    getSortingLabelForColumn,
    type SortDirection,
  } from '@mathesar/components/sort-entry/utils';
  import {
    iconAddFilter,
    iconGrouping,
    iconRemoveFilter,
    iconSortAscending,
    iconSortDescending,
  } from '@mathesar/icons';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';

  const userProfile = getUserProfileStoreFromContext();

  export let processedColumn: ProcessedColumn;

  $: canViewLinkedEntities = !!$userProfile?.hasPermission(
    { database: $currentDatabase, schema: $currentSchema },
    'canViewLinkedEntities',
  );

  $: columnAllowsFiltering = processedColumn.linkFk
    ? canViewLinkedEntities
    : true;

  const imperativeFilterController = getImperativeFilterControllerFromContext();
  const tabularData = getTabularDataStoreFromContext();
  $: ({
    meta: { sorting, grouping, filtering },
  } = $tabularData);

  $: columnId = processedColumn.id;

  $: filterEntries = $filtering.entries.filter((e) => e.columnId === columnId);
  $: filterCount = filterEntries.length;

  $: currentSorting = $sorting.get(processedColumn.id);
  $: sortingLabel = getSortingLabelForColumn(
    processedColumn.abstractType.cellInfo.type,
    !!processedColumn.linkFk,
  );

  $: hasGrouping = $grouping.hasColumn(columnId);

  function addFilter() {
    void imperativeFilterController?.beginAddingNewFilteringEntry(columnId);
  }

  function clearFilters() {
    filtering.update((f) => f.withoutColumns([columnId]));
  }

  function removeSorting() {
    sorting.update((s) => s.without(columnId));
  }

  function applySorting(sortDirection: SortDirection) {
    sorting.update((s) => s.with(columnId, sortDirection));
  }

  function addGrouping() {
    grouping.update((g) =>
      g.withEntry({
        columnId,
        preprocFnId: undefined,
      }),
    );
  }

  function removeGrouping() {
    grouping.update((g) => g.withoutColumns([columnId]));
  }
</script>

{#if columnAllowsFiltering}
  <ButtonMenuItem icon={iconAddFilter} on:click={addFilter}>
    {#if filterCount > 0}
      Add Filter
    {:else}
      Filter Column
    {/if}
  </ButtonMenuItem>
{/if}
{#if filterCount > 0}
  <ButtonMenuItem icon={iconRemoveFilter} on:click={clearFilters}>
    Remove {labeledCount(filterCount, 'filters', {
      casing: 'title',
      countWhenSingular: 'hidden',
    })}
  </ButtonMenuItem>
{/if}

{#if currentSorting === 'ASCENDING'}
  <ButtonMenuItem icon={iconSortAscending} on:click={removeSorting}>
    Remove {sortingLabel.ASCENDING} Sorting
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSortAscending}
    on:click={() => applySorting('ASCENDING')}
  >
    Sort {sortingLabel.ASCENDING}
  </ButtonMenuItem>
{/if}

{#if currentSorting === 'DESCENDING'}
  <ButtonMenuItem icon={iconSortDescending} on:click={removeSorting}>
    Remove {sortingLabel.DESCENDING} Sorting
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSortDescending}
    on:click={() => applySorting('DESCENDING')}
  >
    Sort {sortingLabel.DESCENDING}
  </ButtonMenuItem>
{/if}

{#if hasGrouping}
  <ButtonMenuItem icon={iconGrouping} on:click={removeGrouping}>
    Remove Grouping
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem icon={iconGrouping} on:click={addGrouping}>
    Group by Column
  </ButtonMenuItem>
{/if}
