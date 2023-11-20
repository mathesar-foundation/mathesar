<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { flip } from 'svelte/animate';
  import { Icon, Button } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    Sorting,
  } from '@mathesar/stores/table-data';
  import { iconAddNew } from '@mathesar/icons';
  import SortEntry from '@mathesar/components/sort-entry/SortEntry.svelte';
  import type { SortDirection } from '@mathesar/components/sort-entry/utils';
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
         * This check will esure that the order of the
         * sorters are not changed when the user
         * changes the SortDirection of the top sorters
         */
        newSort = newSort.without(oldColumnId);
      }
      return newSort.with(newColumnId, sortDirection);
    });
  }

  // Functionality for making sort entries draggable.

  let sortEntries: any[];
  $: {
    sortEntries = [...$sorting];
  }
  let sortContainer: HTMLDivElement;
  let topPosition = 0;
  let isDragging = false;
  let dragSortEntry: HTMLElement;
  let selectedSortEntry = -1;
  let currentSlotIndex = -1;

  function handleSortPointerDown(event: PointerEvent) {
    if (selectedSortEntry != -1) {
      isDragging = true;
      const containerRect = sortContainer.getBoundingClientRect();
      const sortEntryRect = dragSortEntry.getBoundingClientRect();

      // Calculate the new top position of the box within the container
      topPosition = Math.max(
        0,
        Math.min(
          containerRect.height - sortEntryRect.height,
          event.clientY - containerRect.top - sortEntryRect.height / 2,
        ),
      );
      if (selectedSortEntry >= 0) {
        // Initally the selectedSortEntry would be at it's slot.
        currentSlotIndex = selectedSortEntry;

        dragSortEntry.style.top = `${topPosition}px`;
        dragSortEntry.style.width = `${containerRect.width}px`;
      }
    }

    // Attach events to the body for global pointer move and up events
    document.body.addEventListener('pointermove', handleSortPointerMove);
    document.body.addEventListener('pointerup', handleSortPointerUp);
  }

  function handleSortPointerMove(event: PointerEvent) {
    if (isDragging) {
      const containerRect = sortContainer.getBoundingClientRect();
      const sortEntryRect = dragSortEntry.getBoundingClientRect();

      // Calculate the new top position of the box within the container
      topPosition = Math.max(
        0,
        Math.min(
          containerRect.height - sortEntryRect.height,
          event.clientY - containerRect.top - sortEntryRect.height / 2,
        ),
      );

      // Get the slot on which the selected entry is hovering.
      let slotHeight = sortEntryRect.height;
      const nearestSlot = Math.round(topPosition / slotHeight) * slotHeight;
      currentSlotIndex = Math.round(nearestSlot / slotHeight);

      // Replace the Sort Entries
      if (selectedSortEntry != currentSlotIndex) {
        move(selectedSortEntry, currentSlotIndex);
        selectedSortEntry = currentSlotIndex;
      }

      // Update the styles directly within the function
      if (selectedSortEntry >= 0) {
        dragSortEntry.style.top = `${topPosition}px`;
        dragSortEntry.style.width = `${containerRect.width}px`;
      }
    }
  }
  function handleSortPointerUp(event: PointerEvent) {
    if (isDragging) {
      isDragging = false;

      // Do not update if sortentries are unchanged
      if (!arraysEqual(sortEntries, [...$sorting])) {
        // Update the new sort order in sorting store
        sorting.update((s: Sorting) => {
          let newSort = new Sorting(sortEntries);
          return newSort;
        });
      }

      // Detach the pointer move and up events
      document.body.removeEventListener('pointermove', handleSortPointerMove);
      document.body.removeEventListener('pointerup', handleSortPointerUp);
    }

    selectedSortEntry = -1;
    currentSlotIndex = -1;
  }

  function move(i: number, j: number) {
    let t = sortEntries[i];
    sortEntries[i] = sortEntries[j];
    sortEntries[j] = t;
    sortEntries = [...sortEntries];
  }
  function arraysEqual(a1: any[], a2: any[]) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1) == JSON.stringify(a2);
  }
</script>

<div class="sorters">
  <div class="header">Sort</div>

  <div
    class="content sort-container"
    bind:this={sortContainer}
    on:pointerdown={handleSortPointerDown}
    on:pointermove={handleSortPointerMove}
    on:pointerup={handleSortPointerUp}
  >
    {#if selectedSortEntry != -1}
      <div bind:this={dragSortEntry} class="sort-entry selected-sort-entry">
        <div class="grab grab-selected">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 448 512"
            ><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
              d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40H40c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40H200c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40H360c-22.1 0-40 17.9-40 40v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328z"
            /></svg
          >
        </div>
        <SortEntry
          columns={$processedColumns}
          columnsAllowedForSelection={availableColumnIds}
          getColumnLabel={(processedColumn) =>
            processedColumn?.column.name ?? ''}
          getColumnConstraintType={(column) =>
            getColumnConstraintTypeByColumnId(column.id, $processedColumns)}
          columnIdentifier={sortEntries[selectedSortEntry][0]}
          sortDirection={sortEntries[selectedSortEntry][1]}
          on:remove={() => removeSortColumn(sortEntries[selectedSortEntry][0])}
          disableColumnChange={false}
        />
      </div>
    {/if}
    {#each sortEntries as [columnId, sortDirection], index (columnId)}
      <div
        class="sort-entry"
        animate:flip={{ delay: 0, duration: 250 }}
        class:ghost-entry={selectedSortEntry == index}
      >
        <div class="grab" on:pointerdown={() => (selectedSortEntry = index)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 448 512"
            ><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
              d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40H40c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40H200c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40H360c-22.1 0-40 17.9-40 40v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328z"
            /></svg
          >
        </div>
        <SortEntry
          columns={$processedColumns}
          columnsAllowedForSelection={availableColumnIds}
          getColumnLabel={(processedColumn) =>
            processedColumn?.column.name ?? ''}
          getColumnConstraintType={(column) =>
            getColumnConstraintTypeByColumnId(column.id, $processedColumns)}
          columnIdentifier={columnId}
          {sortDirection}
          on:remove={() => removeSortColumn(columnId)}
          disableColumnChange={false}
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
  .grab {
    margin-right: 5px;
    cursor: grab;
  }

  .grab-selected {
    background-color: white;
    cursor: grabbing;
  }

  .sort-container {
    position: relative;
    user-select: none;
  }

  .sort-entry {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    padding: 5px 0 5px 0;
  }

  .ghost-entry {
    visibility: hidden;
  }

  .selected-sort-entry {
    position: absolute;
    background-color: transparent;
    z-index: 2000;
    width: 100%;
    top: 30;
  }

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
    }

    .header {
      font-weight: bolder;
    }
  }
</style>
