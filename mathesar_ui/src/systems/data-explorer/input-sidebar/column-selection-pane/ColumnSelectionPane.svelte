<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type QueryManager from '../../QueryManager';
  import type { ColumnWithLink } from '../../utils';

  import SelectableColumn from './SelectableColumn.svelte';
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

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
    <header>{$_('from_base_table')}</header>
    <div class="content">
      {#each [...baseTableColumns] as [columnId, column] (columnId)}
        <SelectableColumn
          {column}
          usageCount={$query.getColumnCount(column)}
          on:add
        />
      {/each}
    </div>
  </section>
  {#if !hasInitialColumns && (hasLinksFromBaseTable || hasLinksToBaseTable)}
    <section>
      <header>{$_('from_related_tables')}</header>
      <div class="content">
        <div class="help-text">
          {$_('one_column_from_base_is_required')}
        </div>
      </div>
    </section>
  {:else}
    {#if hasLinksFromBaseTable}
      <section>
        <header>{$_('references_from_base_table')}</header>
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
        <header>{$_('references_to_base_table')}</header>
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
        padding: var(--sm3);
        background: var(--inspector-hover);
        font-weight: 590;
      }
      .content {
        padding: var(--lg1);

        .help-text {
          font-size: var(--sm1);
        }
      }
    }
  }
</style>
