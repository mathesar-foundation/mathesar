<script lang="ts">
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import SelectableColumn from './SelectableColumn.svelte';
  import type QueryManager from '../../QueryManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let queryManager: QueryManager;

  $: ({ inputColumns, query } = queryManager);
  $: ({ baseTableColumns, tablesThatReferenceBaseTable } = $inputColumns);
  $: hasInitialColumns = $query.initial_columns.length > 0;
  $: hasLinksFromBaseTable = [...baseTableColumns].some(
    ([, entry]) => entry.linksTo !== undefined,
  );
  $: hasLinksToBaseTable = tablesThatReferenceBaseTable.size > 0;
</script>

<div data-identifier="column-selection-list">
  <section>
    <header>From Base table</header>
    <div class="content">
      {#each [...baseTableColumns] as [columnId, column] (columnId)}
        <SelectableColumn {column} on:add />
      {/each}
    </div>
  </section>
  {#if !hasInitialColumns && (hasLinksFromBaseTable || hasLinksToBaseTable)}
    <section>
      <header>From linked tables</header>
      <div class="content">
        <div class="help-text">
          At least one column from the base table is required to add columns
          from linked tables.
        </div>
      </div>
    </section>
  {:else}
    {#if hasLinksFromBaseTable}
      <section>
        <header>Linked from Base table</header>
        <div class="content">
          <SelectableColumnTree
            showColumnsWithoutLinks={false}
            columnsWithLinks={baseTableColumns}
            on:add
          />
        </div>
      </section>
    {/if}
    {#if hasLinksToBaseTable}
      <section>
        <header>Linked to Base table</header>
        <div class="content" data-identifier="referenced-by-tables">
          {#if hasInitialColumns}
            {#each [...tablesThatReferenceBaseTable] as [tableId, table] (tableId)}
              <TableGroupCollapsible
                tableName={table.name}
                column={table.referencedViaColumn}
                direction="out"
              >
                <SelectableColumnTree columnsWithLinks={table.columns} on:add />
              </TableGroupCollapsible>
            {/each}
          {/if}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style lang="scss">
  [data-identifier='column-selection-list'] {
    position: relative;

    section {
      header {
        padding: var(--size-xx-small);
        background: var(--sand-200);
        font-weight: 590;
      }
      .content {
        padding: var(--size-large);
      }
    }
  }
</style>
