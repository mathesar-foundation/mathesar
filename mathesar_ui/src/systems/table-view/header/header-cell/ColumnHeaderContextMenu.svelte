<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import {
    type SortDirection,
    getSortingLabelForColumn,
  } from '@mathesar/components/sort-entry/utils';
  import {
    iconAddFilter,
    iconGrouping,
    iconRemoveFilter,
    iconSortAscending,
    iconSortDescending,
    iconTable,
  } from '@mathesar/icons';
  import { getImperativeFilterControllerFromContext } from '@mathesar/pages/table/ImperativeFilterController';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { ButtonMenuItem, LinkMenuItem } from '@mathesar-component-library';

  export let processedColumn: ProcessedColumn;

  const canViewLinkedEntities = true;

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

  $: ({ linkFk } = processedColumn);
  $: linkedTable = linkFk
    ? $currentTablesData.tablesMap.get(linkFk.referent_table_oid)
    : undefined;
  $: linkedTableHref = linkedTable
    ? $storeToGetTablePageUrl({ tableId: linkedTable.oid })
    : undefined;

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

{#if linkedTable && linkedTableHref}
  <LinkMenuItem icon={iconTable} href={linkedTableHref}>
    <RichText text={$_('open_named_table')} let:slotName>
      {#if slotName === 'tableName'}
        <Identifier>{linkedTable.name}</Identifier>
      {/if}
    </RichText>
  </LinkMenuItem>
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
