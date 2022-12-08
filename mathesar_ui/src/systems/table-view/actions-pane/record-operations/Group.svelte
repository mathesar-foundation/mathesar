<script lang="ts">
  import { DropdownMenu, ButtonMenuItem } from '@mathesar-component-library';
  import type { Writable } from 'svelte/store';
  import {
    getTabularDataStoreFromContext,
    type Grouping,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import GroupEntryComponent from '@mathesar/components/group-entry/GroupEntry.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let grouping: Writable<Grouping>;
  $: ({ processedColumns } = $tabularData);

  /** Columns which are not already used as a grouping entry */
  $: availableColumns = [...$processedColumns.values()].filter(
    (column) => !$grouping.hasColumn(column.id),
  );

  function addGroupColumn(column: ProcessedColumn) {
    grouping.update((g) =>
      g.withEntry({
        columnId: column.id,
        preprocFnId: undefined,
      }),
    );
  }

  function updateGrouping(
    index: number,
    updateEventDetail: {
      preprocFunctionIdentifier: string | undefined;
      columnIdentifier: number;
    },
  ) {
    grouping.update((g) =>
      g.withReplacedEntry(index, {
        columnId: updateEventDetail.columnIdentifier,
        preprocFnId: updateEventDetail.preprocFunctionIdentifier,
      }),
    );
  }
</script>

<div class="groups" class:grouped={$grouping.entries.length > 0}>
  <header>Group records by</header>
  <div class="content">
    {#each $grouping.entries as groupEntry, index (index)}
      <GroupEntryComponent
        columns={$processedColumns}
        columnsAllowedForSelection={availableColumns.map((entry) => entry.id)}
        getColumnLabel={(processedColumn) => processedColumn?.column.name ?? ''}
        columnIdentifier={groupEntry.columnId}
        preprocFunctionIdentifier={groupEntry.preprocFnId}
        on:update={(e) => updateGrouping(index, e.detail)}
        on:removeGroup={() => grouping.update((g) => g.withoutEntry(index))}
        disableColumnChange={$grouping.entries.length > 1 &&
          index < $grouping.entries.length - 1}
      />
    {:else}
      <span class="muted">No grouping condition has been added</span>
    {/each}
  </div>
  <footer>
    <DropdownMenu
      label="Add New Grouping"
      disabled={availableColumns.length === 0}
      triggerAppearance="secondary"
    >
      {#each availableColumns as column (column.id)}
        <ButtonMenuItem on:click={() => addGroupColumn(column)}>
          {$processedColumns.get(column.id)?.column.name}
        </ButtonMenuItem>
      {/each}
    </DropdownMenu>
  </footer>
</div>

<style lang="scss">
  .groups {
    min-width: 25rem;
    padding: 1rem;

    header {
      font-weight: bolder;
    }
    .content {
      margin-top: 0.8rem;

      :global(.input-group) {
        margin-top: 0.4rem;
      }

      :global(.input-group-text) {
        flex-grow: 1;
      }
    }

    footer {
      margin-top: 1rem;
    }

    .muted {
      color: var(--slate-400);
    }
  }
</style>
