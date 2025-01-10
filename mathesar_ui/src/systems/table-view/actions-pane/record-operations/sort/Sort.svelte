<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import SortEntry from '@mathesar/components/sort-entry/SortEntry.svelte';
  import type { SortDirection } from '@mathesar/components/sort-entry/utils';
  import {
    sortableContainer,
    sortableItem,
    sortableTrigger,
  } from '@mathesar/components/sortable/sortable';
  import { iconAddNew, iconGrip } from '@mathesar/icons';
  import {
    Sorting,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { Button, ButtonMenuItem, DropdownMenu, Icon } from '@mathesar-component-library';
    import ColumnName from '@mathesar/components/column/ColumnName.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let sorting: Writable<Sorting>;
  $: ({ processedColumns } = $tabularData);

  /** Columns which are not already used as a sorting entry */
  $: availableColumnIds = [...$processedColumns.values()]
    .filter((column) => !$sorting.has(column.id))
    .map((entry) => entry.id);
  
  $: availableColumns = [...$processedColumns.values()]
    .filter((column) => !$sorting.has(column.id));

  function addSortColumn() {
    const [newSortColumnId] = availableColumnIds;
    sorting.update((s) => s.with(newSortColumnId, 'ASCENDING'));
  }

  function removeSortColumn(columnId: number) {
    sorting.update((s) => s.without(columnId));
  }

  function updateSortEntry(
    columnId: number,
    newColumnId: number,
    newSortDirection: SortDirection,
  ) {
    // This logic may seem a bit complex for a simple update, but it's necessary
    // to preserve the order of the sort entries in the store. We need to ensure
    // that if the user changes the column or sort direction within a sort
    // entry, then the position of that entry is preserved among all entries.
    // This is tricky because the entries have no unique identifier. We map over
    // all entries in order to build a new sorting object with the same order of
    // entries.
    sorting.update(
      (oldSorting) =>
        new Sorting(
          [...oldSorting].map(([oldColumnId, oldDirection]) =>
            oldColumnId === columnId
              ? [newColumnId, newSortDirection]
              : [oldColumnId, oldDirection],
          ),
        ),
    );
  }
</script>

<div class="sorters">
  <div class="header">{$_('sort')}</div>

  <div
    class="content"
    use:sortableContainer={{
      getItems: () => [...$sorting],
      onSort: (newEntries) => sorting.set(new Sorting(newEntries)),
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
      <span>{$_('no_sorting_condition_added')}</span>
    {/each}
  </div>
  {#if availableColumnIds.length > 0}
    <div class="footer">
      <DropdownMenu
        label={$_('add_new_sort_condition')}
        disabled={availableColumnIds.length === 0}
        triggerAppearance="secondary"
      >
        <!-- <Button appearance="secondary" on:click={addSortColumn}>
          <Icon {...iconAddNew} />
          <span>{$_('add_new_sort_condition')}</span>
        </Button> -->
        {#each availableColumns as column (column.id)}
          <ButtonMenuItem on:click={addSortColumn}>
            <ColumnName 
              column={{
              name: $processedColumns.get(column.id)?.column.name ?? '',
              type: $processedColumns.get(column.id)?.column.type ?? '',
              type_options:
                $processedColumns.get(column.id)?.column.type_options ?? null,
              constraintsType: getColumnConstraintTypeByColumnId(
                column.id,
                $processedColumns,
              ),
              }}
            />
          </ButtonMenuItem>
        {/each}
      </DropdownMenu>
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
