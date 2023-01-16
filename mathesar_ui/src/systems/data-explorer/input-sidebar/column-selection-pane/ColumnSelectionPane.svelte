<script lang="ts">
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import SelectableColumn from './SelectableColumn.svelte';
  import type QueryManager from '../../QueryManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';
  import type { ColumnWithLink } from '../../utils';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  $: ({ inputColumns, query } = queryManager);
  $: ({ baseTableColumns, tablesThatReferenceBaseTable } = $inputColumns);
  $: hasInitialColumns = $query.initial_columns.length > 0;
  $: baseTableColumnsWithLinks = new Map(
    [...baseTableColumns].filter(([, entry]) => entry.linksTo !== undefined),
  );
  $: hasLinksFromBaseTable = baseTableColumnsWithLinks.size > 0;
  $: hasLinksToBaseTable = tablesThatReferenceBaseTable.length > 0;
</script>

<div data-identifier="column-selection-list">
  <section>
    <header>From Base table</header>
    <div class="content">
      {#each [...baseTableColumns] as [columnId, column] (columnId)}
        <SelectableColumn
          {column}
          usageCount={$query.getColumnCount(columnId)}
          on:add
        />
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
            columnsWithLinks={baseTableColumnsWithLinks}
            {linkCollapsibleOpenState}
            {query}
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
            <!--table.id is not unique here. Same table can be present multiple times-->
            {#each tablesThatReferenceBaseTable as table (table)}
              <TableGroupCollapsible
                tableName={table.name}
                column={table.referencedViaColumn}
                {linkCollapsibleOpenState}
              >
                <SelectableColumnTree
                  {linkCollapsibleOpenState}
                  columnsWithLinks={table.columns}
                  {query}
                  on:add
                />
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

        .help-text {
          font-size: var(--text-size-small);
        }
      }
    }
  }
</style>
