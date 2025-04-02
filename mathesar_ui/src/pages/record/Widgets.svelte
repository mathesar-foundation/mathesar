<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type {
    JoinableTable,
    JoinableTablesResult,
  } from '@mathesar/api/rpc/tables';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconRecord } from '@mathesar/icons';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { Help, isDefinedNonNullable } from '@mathesar-component-library';

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
  <div class="widgets-area">
    <h2>
      {$_('related_records')}
      <Help>
        <RichText text={$_('related_records_help')} let:slotName>
          {#if slotName === 'recordSummary'}
            <NameWithIcon icon={iconRecord} truncate={false}>
              <strong>{recordSummary}</strong>
            </NameWithIcon>
          {/if}
        </RichText>
      </Help>
    </h2>
    <div class="widgets">
      {#each tableWidgetInputs as { table, fkColumn } (`${table.oid}-${fkColumn.id}`)}
        <section class="table-widget-positioner">
          <TableWidget {recordPk} {table} {fkColumn} />
        </section>
      {/each}
    </div>
  </div>
{:else}
  <div class="no-widgets" />
{/if}

<style lang="scss">
  .widgets-area {
    background: var(--background-color);
    border-top: 1px solid var(--border-color);
  }
  .no-widgets {
    background: var(--background-color);
  }
  h2 {
    padding: var(--size-small);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-color);
    color: var(--text-color-primary);
  }
  .widgets {
    padding: var(--size-small);

    :global(.sheet) {
      background: var(--background-color);
    }
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
