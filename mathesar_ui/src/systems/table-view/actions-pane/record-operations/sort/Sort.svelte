<script lang="ts">
  import type { Writable } from 'svelte/store';

  import { Button, Icon } from '@mathesar-component-library';
  import SortEntry from '@mathesar/components/sort-entry/SortEntry.svelte';
  import type { SortDirection } from '@mathesar/components/sort-entry/utils';
  import { sortableContainer, sortableItem, sortableTrigger } from '@mathesar/components/sortable/sortable';
  import { iconAddNew, iconGrip } from '@mathesar/icons';
  import {
      Sorting,
      getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';

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
         * This check will ensure that the order of the sorters are not changed
         * when the user changes the SortDirection of the top sorters
         */
        newSort = newSort.without(oldColumnId);
      }
      return newSort.with(newColumnId, sortDirection);
    });
  }
</script>

<div class="sorters">
  <div class="header">Sort</div>

  <div
    class="content"
    use:sortableContainer={{
      getItems: () => [...$sorting],
      onSort: (newEntries) => sorting.set(new Sorting(newEntries))
    }}
  >
    {#each [...$sorting] as [columnId, sortDirection] (columnId)}
      <div use:sortableItem class="item">
        <div use:sortableTrigger class="trigger"><Icon {...iconGrip} /></div>
        <SortEntry
          columns={$processedColumns}
          columnsAllowedForSelection={availableColumnIds}
          getColumnLabel={(c) => c?.column.name ?? ''}
          getColumnConstraintType={(column) =>
            getColumnConstraintTypeByColumnId(column.id, $processedColumns)}
          columnIdentifier={columnId}
          {sortDirection}
          on:remove={() => removeSortColumn(columnId)}
          on:update={(e) =>
            updateSortEntry(
              columnId,
              e.detail.columnIdentifier,
              e.detail.sortDirection,
            )}
        />
      </div>
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
  @import '/src/components/sortable/sortable.css';

  .sorters {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      min-width: 21rem;
    }
    .item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem;
      align-items: stretch;
    }
    .trigger {
      display: flex;
      align-items: center;
    }

    .header {
      font-weight: bolder;
    }
  }
</style>
