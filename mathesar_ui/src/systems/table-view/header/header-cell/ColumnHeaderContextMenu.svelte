<script lang="ts">
  import { ButtonMenuItem } from '@mathesar/component-library';
  import { iconGrouping, iconSorting } from '@mathesar/icons';
  import {
    getTabularDataStoreFromContext,
    SortDirection,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { getSortingLabelForColumn } from './utils';

  export let processedColumn: ProcessedColumn;

  const tabularData = getTabularDataStoreFromContext();
  $: ({
    meta: { sorting, grouping },
  } = $tabularData);

  $: columnId = processedColumn.id;

  $: currentSorting = $sorting.get(processedColumn.id);
  $: sortingLabel = getSortingLabelForColumn(
    processedColumn.abstractType.cellInfo.type,
    !!processedColumn.linkFk,
  );

  $: hasGrouping = $grouping.hasColumn(columnId);

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

{#if currentSorting === SortDirection.A}
  <ButtonMenuItem icon={iconSorting} on:click={removeSorting}>
    Remove {sortingLabel[SortDirection.A]} Sorting
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSorting}
    on:click={() => applySorting(SortDirection.A)}
  >
    Sort {sortingLabel[SortDirection.A]}
  </ButtonMenuItem>
{/if}

{#if currentSorting === SortDirection.D}
  <ButtonMenuItem icon={iconSorting} on:click={removeSorting}>
    Remove {sortingLabel[SortDirection.D]} Sorting
  </ButtonMenuItem>
{:else}
  <ButtonMenuItem
    icon={iconSorting}
    on:click={() => applySorting(SortDirection.D)}
  >
    Sort {sortingLabel[SortDirection.D]}
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
