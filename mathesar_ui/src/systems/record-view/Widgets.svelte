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
  export let isInModal = false;

  function buildWidgetInput(joinableTable: JoinableTable) {
    const table = $currentTablesData.tablesMap.get(joinableTable.target);
    if (!table) return undefined;
    const fkColumnId = joinableTable.join_path[0].slice(-1)[0][1];
    const { name } =
      joinableTablesResult.target_table_info[table.oid].columns[fkColumnId];
    return { table, fkColumn: { id: fkColumnId, name, metadata: null } };
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
        <TableWidget
          {recordPk}
          {recordSummary}
          {table}
          {fkColumn}
          {isInModal}
        />
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
  .table-widget-positioner {
    margin-top: 2rem;
    border-top: solid 1px var(--border-color);
    padding-top: 1rem;
  }
</style>
