<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { Icon, Button } from '@mathesar-component-library';
  import { SortDirection, type Sorting } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/tables/columns';
  import { iconAddNew } from '@mathesar/icons';
  import SortEntries from './SortEntries.svelte';

  export let sorting: Writable<Sorting>;
  export let columns: Column[];

  /** Columns which are not already used as a sorting entry */
  $: availableColumns = columns.filter((column) => !$sorting.has(column.id));

  function addSortColumn() {
    const [newSortColumn] = availableColumns;
    const newSortDirection = SortDirection.A;
    sorting.update((s) => s.with(newSortColumn.id, newSortDirection));
  }

  function removeSortColumn(columnId: number) {
    sorting.update((s) => s.without(columnId));
  }

  function updateSorter(
    sorter: { columnId: number; direction: SortDirection },
    oldColumnId: number,
  ) {
    /**
     * This check will esure that the order of the
     * sorters are not changed when the user
     * changes the SortDirection of the top sorters
     */
    if (oldColumnId !== sorter.columnId) {
      sorting.update((s) => s.without(oldColumnId));
    }
    sorting.update((s) => s.with(sorter.columnId, sorter.direction));
  }
</script>

<div class="sorters">
  <div class="header">Sort</div>
  <div class="content">
    {#each [...$sorting] as [columnId, sortDirection], index (columnId)}
      <SortEntries
        {availableColumns}
        {sortDirection}
        {columns}
        sortColumnId={columnId}
        on:remove={(e) => removeSortColumn(e.detail)}
        disabled={index < $sorting.size - 1}
        on:update={(e) => updateSorter(e.detail, columnId)}
      />
    {:else}
      <span>No Sorters have been added</span>
    {/each}
  </div>
  {#if availableColumns.length > 0}
    <div class="footer">
      <Button appearance="secondary" on:click={addSortColumn}>
        <Icon {...iconAddNew} />
        <span>Add new sort column</span>
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

      > :global(* + *) {
        margin-top: 0.5rem;
      }
    }

    .header {
      font-weight: bolder;
    }
  }
</style>
