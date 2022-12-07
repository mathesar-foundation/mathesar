<script lang="ts">
  import type { JoinableTablesResult } from '@mathesar/api/types/tables/joinable_tables';
  import { Help } from '@mathesar-component-library';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconRecord } from '@mathesar/icons';
  import TableWidget from './TableWidget.svelte';

  export let recordId: number;
  export let recordSummary: string;
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
    }))
    .sort((a, b) => a.table.name.localeCompare(b.table.name));
</script>

{#if tableWidgetInputs.length}
  <div class="widgets-area">
    <h2 class="passthrough">
      Related Records
      <Help>
        Each of the following records links to
        <NameWithIcon icon={iconRecord} truncate={false}>
          <strong>{recordSummary}</strong>
        </NameWithIcon>
        via a linking column in its corresponding table. (For convenience, that linking
        column is hidden from view here.)
      </Help>
      <hr />
    </h2>
    <div class="widgets">
      {#each tableWidgetInputs as { table, fkColumn } (`${table.id}-${fkColumn.id}`)}
        <section class="table-widget-positioner">
          <TableWidget {table} {fkColumn} {recordId} />
        </section>
      {/each}
    </div>
  </div>
{:else}
  <div class="no-widgets" />
{/if}

<style lang="scss">
  .widgets-area {
    background: var(--sand-100);
  }
  .no-widgets {
    background: var(--sand-200);
  }
  h2 {
    font-weight: bold;
    background: var(--white);
    padding: 0.5em 1em;
    position: relative;
  }
  h2 hr {
    margin: 0;
    position: absolute;
    bottom: 0;
    left: 1em;
    right: 1em;
    border: solid var(--slate-200) 1px;
  }
  .widgets {
    padding: 1rem;
  }
  .table-widget-positioner {
    margin: 4rem 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
</style>
