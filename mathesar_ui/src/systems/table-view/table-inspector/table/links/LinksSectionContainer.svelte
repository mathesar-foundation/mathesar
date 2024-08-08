<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
  import { iconAddNew } from '@mathesar/icons';
  import {
    iconLinksFromOtherTables,
    iconLinksInThisTable,
  } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import LinkTableModal from '@mathesar/systems/table-view/link-table/LinkTableModal.svelte';
  import { Button, Icon, defined } from '@mathesar-component-library';

  import LinkSection from './LinkSection.svelte';
  import type { TableLink } from './utils';

  const linkTableModal = modal.spawnModalController();

  export let joinableTablesResult: JoinableTablesResult;
  export let currentTableColumns: Map<number, ProcessedColumn>;

  $: joinableTables = joinableTablesResult.joinable_tables;

  $: linksInThisTable = (() => {
    const linkedTables = joinableTables.filter((t) => !t.fkey_path[0][1]);
    const links: TableLink[] = linkedTables.map((joinableTable) => {
      const table =
        joinableTablesResult.target_table_info[joinableTable.target];
      const columnId = joinableTable.join_path[0][0][1];
      return {
        table: { id: joinableTable.target, name: table.name },
        column: defined(currentTableColumns.get(columnId), ({ column }) => ({
          name: column.name,
        })),
      };
    });
    return links;
  })();

  $: linksFromOtherTables = (() => {
    const linkedTables = joinableTables.filter((t) => t.fkey_path[0][1]);
    const links: TableLink[] = linkedTables.map((joinableTable) => {
      const table =
        joinableTablesResult.target_table_info[joinableTable.target];
      const columnId = joinableTable.join_path[0][1][1];
      return {
        table: { id: joinableTable.target, name: table.name },
        column: table.columns[columnId],
      };
    });
    return links;
  })();

  $: showNullState = !linksInThisTable.length && !linksFromOtherTables.length;
</script>

<div class="links-section">
  {#if linksInThisTable.length}
    <LinkSection
      links={linksInThisTable}
      icon={iconLinksInThisTable}
      title={$_('in_this_table')}
    />
  {/if}
  {#if linksFromOtherTables.length}
    <LinkSection
      links={linksFromOtherTables}
      icon={iconLinksFromOtherTables}
      title={$_('from_other_tables')}
    />
  {/if}
  {#if showNullState}
    <span class="null-text">{$_('table_does_not_link')}</span>
  {/if}
  <div>
    <Button on:click={() => linkTableModal.open()} appearance="secondary">
      <Icon {...iconAddNew} />
      <span>{$_('create_link')}</span>
    </Button>
    <LinkTableModal controller={linkTableModal} />
  </div>
</div>

<style lang="scss">
  .links-section {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
  .null-text {
    color: var(--color-text-muted);
  }
</style>
