<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
  import { Help } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconRecord } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
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
  export let recordSummary: string;
  export let table: Table;
  export let fkColumn: Pick<RawColumnWithMetadata, 'id' | 'name'>;

  $: tabularData = new TabularData({
    database: table.schema.database,
    table,
    meta,
    contextualFilters: new Map([[fkColumn.id, recordPk]]),
  });
  $: tabularDataStore.set(tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
</script>

<div class="table-widget">
  <div class="top">
    <h3 class="bold-header">
      <TableName {table} truncate={false} />
      <Help>
        <RichText text={$_('related_records_help')} let:slotName>
          {#if slotName === 'tableName'}
            <TableName {table} truncate={false} />
          {/if}
          {#if slotName === 'recordSummary'}
            <NameWithIcon icon={iconRecord} truncate={false} bold>
              {recordSummary}
            </NameWithIcon>
          {/if}
          {#if slotName === 'columnName'}
            <ColumnName
              column={{
                name: fkColumn.name,
                type: 'unknown',
                type_options: null,
                constraintsType: ['foreignkey'],
              }}
              truncate={false}
              bold
            />
          {/if}
        </RichText>
      </Help>
    </h3>

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
    color: var(--color-fg-base);
    margin-bottom: var(--sm1);
  }
  .top > :global(*) {
    overflow: hidden;
  }
  .bold-header {
    margin: 0;
  }
  .results {
    margin-top: var(--sm1);
    border: transparent;
  }
</style>
