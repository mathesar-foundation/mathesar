<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { Icon, Button } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    Sorting,
  } from '@mathesar/stores/table-data';
  import { iconAddNew } from '@mathesar/icons';
  import DraggableSortEntries from './drag-and-drop/DraggableSortEntries.svelte';

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
</script>

<div class="sorters">
  <div class="header">Sort</div>

  <DraggableSortEntries {sorting} />
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

    .header {
      font-weight: bolder;
    }
  }
</style>
