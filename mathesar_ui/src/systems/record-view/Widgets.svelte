<script lang="ts">
  import type {
    JoinableTable,
    JoinableTablesResult,
  } from '@mathesar/api/rpc/tables';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { databasesStore } from '@mathesar/stores/databases';
  import { getTableFromStoreOrApi } from '@mathesar/stores/tables';
  import { isDefinedNonNullable } from '@mathesar-component-library';

  import TableWidget from './TableWidget.svelte';

  export let recordPk: string;
  export let recordSummary: string;
  export let joinableTablesResult: JoinableTablesResult;
  export let isInModal = false;

  $: database = databasesStore.currentDatabase;

  async function buildWidgetInput(joinableTable: JoinableTable) {
    if (!$database) return undefined;
    const targetTable = await getTableFromStoreOrApi({
      database: $database,
      tableOid: joinableTable.target,
    });

    const fkColumnId = joinableTable.join_path[0].slice(-1)[0][1];
    const { name } =
      joinableTablesResult.target_table_info[targetTable.oid].columns[
        fkColumnId
      ];
    return {
      table: targetTable,
      fkColumn: { id: fkColumnId, name, metadata: null },
    };
  }

  const joinableTablesStore = new AsyncStore(
    (joinableTables: JoinableTable[]) =>
      Promise.all(
        joinableTables
          .filter((joinableTable) => joinableTable.multiple_results)
          .map((joinableTable) => buildWidgetInput(joinableTable)),
      ),
  );

  $: void joinableTablesStore.run(joinableTablesResult.joinable_tables);
  $: joinableTables = $joinableTablesStore.resolvedValue;

  $: tableWidgetInputs =
    joinableTables
      ?.filter(isDefinedNonNullable)
      .sort((a, b) => a.table.name.localeCompare(b.table.name)) ?? [];
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
