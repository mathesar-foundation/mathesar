<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';

  import RecordPageContent from './RecordPageContent.svelte';
  import RecordPageLoadingSpinner from './RecordPageLoadingSpinner.svelte';
  import type RecordStore from './RecordStore';

  export let record: RecordStore;

  $: table = $currentTable as Table;
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
  $: tableStructure = new TableStructure({
    database: table.schema.database,
    table,
    abstractTypesMap,
  });
  $: tableStructureIsLoading = tableStructure.isLoading;
  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: isLoading = $tableStructureIsLoading || recordStoreIsLoading;
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

<LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
  {#if isLoading}
    <RecordPageLoadingSpinner />
  {:else if canViewTable}
    <RecordPageContent {tableStructure} {record} />
  {:else}
    <div class="no-access">
      <WarningBox fullWidth>
        {$_('no_privileges_view_record')}
      </WarningBox>
    </div>
  {/if}
</LayoutWithHeader>

<style>
  .no-access {
    padding: var(--size-base);
  }
</style>
