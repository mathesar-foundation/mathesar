<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';

  import RecordViewContent from './RecordViewContent.svelte';
  import RecordViewLoadingSpinner from './RecordViewLoadingSpinner.svelte';
  import type RecordStore from './RecordStore';

  export let record: RecordStore;

  $: table = $currentTable as Table;
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
  $: tableStructure = new TableStructure(table);
  $: tableStructureIsLoading = tableStructure.isLoading;
  $: recordStoreFetchRequest = record.fetchRequest;
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: isLoading = $tableStructureIsLoading || recordStoreIsLoading;
</script>

{#if isLoading}
  <RecordViewLoadingSpinner />
{:else if canViewTable}
  <RecordViewContent {tableStructure} {record} />
{:else}
  <div class="no-access">
    <WarningBox fullWidth>
      {$_('no_privileges_view_record')}
    </WarningBox>
  </div>
{/if}

<style>
  .no-access {
    padding: 1rem;
  }
</style>
