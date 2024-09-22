<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import {
    Meta,
    TabularData,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import MiniActionsPane from '@mathesar/systems/table-view/actions-pane/MiniActionsPane.svelte';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );
  const meta = new Meta({
    pagination: new Pagination({ size: 10 }),
  });

  export let recordPk: string;
  export let table: Table;
  export let fkColumn: Pick<Column, 'id' | 'name'>;

  $: tabularData = new TabularData({
    database: table.schema.database,
    table,
    abstractTypesMap,
    meta,
    contextualFilters: new Map([[fkColumn.id, recordPk]]),
  });
  $: tabularDataStore.set(tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
</script>

<div class="table-widget">
  <div class="top">
    <h3 class="bold-header"><TableName {table} /></h3>
    {#if canViewTable}
      <MiniActionsPane />
    {/if}
  </div>

  <div class="results">
    {#if canViewTable}
      <TableView context="widget" {table} />
    {:else}
      <WarningBox fullWidth>
        {$_('no_privileges_view_table')}
      </WarningBox>
    {/if}
  </div>
</div>

<style lang="scss">
  .top {
    display: grid;
    grid-template: auto / 1fr auto;
    gap: 0.5rem;
    justify-content: space-between;
    align-items: center;

    overflow: hidden;
  }
  .top > :global(*) {
    overflow: hidden;
  }
</style>
