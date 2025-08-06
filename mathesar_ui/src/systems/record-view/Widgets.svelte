<script lang="ts">
  import type {
    JoinableTable,
    JoinableTablesResult,
  } from '@mathesar/api/rpc/tables';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { isDefinedNonNullable } from '@mathesar-component-library';

  import TableWidget from './TableWidget.svelte';

  export let recordPk: string;
  export let recordSummary: string;
  export let joinableTablesResult: JoinableTablesResult;

  function buildWidgetInput(joinableTable: JoinableTable) {
    const table = $currentTablesData.tablesMap.get(joinableTable.target);
    if (!table) return undefined;
    const fkColumnId = joinableTable.join_path[0].slice(-1)[0][1];
    const { name } =
      joinableTablesResult.target_table_info[table.oid].columns[fkColumnId];
    return { table, fkColumn: { id: fkColumnId, name } };
  }

  $: tableWidgetInputs = joinableTablesResult.joinable_tables
    .filter((joinableTable) => joinableTable.multiple_results)
    .map(buildWidgetInput)
    .filter(isDefinedNonNullable)
    .sort((a, b) => a.table.name.localeCompare(b.table.name));
</script>

{#if tableWidgetInputs.length}
  <div class="widgets">
    {#each tableWidgetInputs as { table, fkColumn } (`${table.oid}-${fkColumn.id}`)}
      <section class="table-widget-positioner">
        <TableWidget {recordPk} {recordSummary} {table} {fkColumn} />
      </section>
    {/each}
  </div>
{:else}
  <div class="no-widgets" />
{/if}

<style lang="scss">
  .no-widgets {
    background: var(--layout-background-color);
  }
  .widgets {
    padding: var(--sm1);
  }

  .table-widget-positioner {
    margin: 2rem 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
</style>
