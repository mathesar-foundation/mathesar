<script lang="ts">
  import { router } from 'tinro';
  import { _ } from 'svelte-i18n';
  import { ButtonMenuItem } from '@mathesar-component-library';
  import {
    getSortingLabelForColumn,
    type SortDirection,
  } from '@mathesar/components/sort-entry/utils';
  import {
    iconTable,
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
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import Identifier from '@mathesar/components/Identifier.svelte';

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

  $: linkKey = processedColumn.linkFk;
  $: getTablePageUrl = $storeToGetTablePageUrl;
  $: linkedTableName = linkKey ? linkKey.name : undefined;
  $: linkedTableHref = linkKey
    ? getTablePageUrl({ tableId: linkKey.referent_table })
    : undefined;
  $: ({ column } = processedColumn);

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

  function goToTablePage() {
    router.goto(linkedTableHref, true);
  }
</script>

{#if linkedTableHref && linkedTableName}
  <ButtonMenuItem icon={iconTable} on:click={goToTablePage}>
    {$_('open')}
    <Identifier>{column.name}</Identifier>
    {$_('table')}
  </ButtonMenuItem>
{/if}
{#if columnAllowsFiltering}
  <ButtonMenuItem icon={iconAddFilter} on:click={addFilter}>
    {#if filterCount > 0}
      {$_('add_filter')}
    {:else}
      {$_('filter_column')}
    {/if}
  </ButtonMenuItem>
{/if}
{#if filterCount > 0}
  <ButtonMenuItem icon={iconRemoveFilter} on:click={clearFilters}>
    {$_('remove_filters', { values: { count: filterCount } })}
  </ButtonMenuItem>
{/if}

{#if currentSorting === 'ASCENDING'}
  <ButtonMenuItem icon={iconSortAscending} on:click={removeSorting}>
    {$_('remove_sorting_type', {
      values: { sortingType: sortingLabel.ASCENDING },
    })}
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSortAscending}
    on:click={() => applySorting('ASCENDING')}
  >
    {$_('sort_type', { values: { sortingType: sortingLabel.ASCENDING } })}
  </ButtonMenuItem>
{/if}

{#if currentSorting === 'DESCENDING'}
  <ButtonMenuItem icon={iconSortDescending} on:click={removeSorting}>
    {$_('remove_sorting_type', {
      values: { sortingType: sortingLabel.DESCENDING },
    })}
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSortDescending}
    on:click={() => applySorting('DESCENDING')}
  >
    {$_('sort_type', { values: { sortingType: sortingLabel.DESCENDING } })}
  </ButtonMenuItem>
{/if}

{#if hasGrouping}
  <ButtonMenuItem icon={iconGrouping} on:click={removeGrouping}>
    {$_('remove_grouping')}
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem icon={iconGrouping} on:click={addGrouping}>
    {$_('group_by_column')}
  </ButtonMenuItem>
{/if}
