<script lang="ts">
  import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';
  import TableWidget from './TableWidget.svelte';

  export let recordId: number;
  export let joinableTablesResult: JoinableTablesResult;

  $: tableNameMap = new Map(
    Object.entries(joinableTablesResult.tables).map(([tableId, table]) => [
      parseInt(tableId, 10),
      table.name,
    ]),
  );
  $: columnNameMap = new Map(
    Object.entries(joinableTablesResult.columns).map(([columnId, column]) => [
      parseInt(columnId, 10),
      column.name,
    ]),
  );
  $: tableWidgetInputs = joinableTablesResult.joinable_tables
    .filter((joinableTable) => joinableTable.multiple_results)
    .map((joinableTable) => ({
      table: {
        id: joinableTable.target,
        name: tableNameMap.get(joinableTable.target) ?? '(unknown table)',
      },
      fkColumn: {
        id: joinableTable.jp_path[0].slice(-1)[0],
        name:
          columnNameMap.get(joinableTable.jp_path[0].slice(-1)[0]) ??
          '(unknown column)',
      },
    }));
</script>

{#each tableWidgetInputs as { table, fkColumn }}
  <section class="table-widget-positioner">
    <TableWidget {table} {fkColumn} {recordId} />
  </section>
{/each}

<style>
  .table-widget-positioner {
    margin: 4rem 0;
  }
</style>
