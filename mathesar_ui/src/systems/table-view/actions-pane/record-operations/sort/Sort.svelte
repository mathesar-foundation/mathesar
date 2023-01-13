<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { Icon, Button } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    type Sorting,
  } from '@mathesar/stores/table-data';
  import { iconAddNew } from '@mathesar/icons';
  import SortEntry from '@mathesar/components/sort-entry/SortEntry.svelte';
  import type { SortDirection } from '@mathesar/components/sort-entry/utils';

  const tabularData = getTabularDataStoreFromContext();

  export let sorting: Writable<Sorting>;
  $: ({ processedColumns } = $tabularData);

  /** Columns which are not already used as a sorting entry */
  $: availableColumnIds = [...$processedColumns.values()]
    .filter((column) => !$sorting.has(column.id))
    .map((entry) => entry.id);

  function addSortColumn() {
    const [newSortColumnId] = availableColumnIds;
    sorting.update((s) => s.with(newSortColumnId, 'ASCENDING'));
  }

  function removeSortColumn(columnId: number) {
    sorting.update((s) => s.without(columnId));
  }

  function updateSortEntry(
    oldColumnId: number,
    newColumnId: number,
    sortDirection: SortDirection,
  ) {
    sorting.update((s) => {
      let newSort = s;
      if (oldColumnId !== newColumnId) {
        /**
         * This check will esure that the order of the
         * sorters are not changed when the user
         * changes the SortDirection of the top sorters
         */
        newSort = newSort.without(oldColumnId);
      }
      return newSort.with(newColumnId, sortDirection);
    });
  }
</script>

<div class="sorters">
  <div class="header">Sort</div>
  <div class="content">
    {#each [...$sorting] as [columnId, sortDirection], index (columnId)}
      <SortEntry
        columns={$processedColumns}
        columnsAllowedForSelection={availableColumnIds}
        getColumnLabel={(processedColumn) => processedColumn?.column.name ?? ''}
        columnIdentifier={columnId}
        {sortDirection}
        on:remove={() => removeSortColumn(columnId)}
        disableColumnChange={index < $sorting.size - 1}
        on:update={(e) =>
          updateSortEntry(
            columnId,
            e.detail.columnIdentifier,
            e.detail.sortDirection,
          )}
      />
    {:else}
      <span>No sorting condition has been added</span>
    {/each}
  </div>
  {#if availableColumnIds.length > 0}
    <div class="footer">
      <Button appearance="secondary" on:click={addSortColumn}>
        <Icon {...iconAddNew} />
        <span>Add new sort condition</span>
      </Button>
    </div>
  {/if}
</div>

<style lang="scss">
  .sorters {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }

    .content {
      display: flex;
      flex-direction: column;
      min-width: 21rem;

      :global(.input-group .select-sort-direction) {
        width: 9rem;
        flex-grow: 0;
      }
      :global(.select-sort-column) {
        flex-grow: 1;
      }

      > :global(* + *) {
        margin-top: 0.5rem;
      }
    }

    .header {
      font-weight: bolder;
    }
  }
</style>
