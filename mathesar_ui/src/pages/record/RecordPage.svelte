<script lang="ts">
  import type { Table } from '@mathesar/api/rpc/tables';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { displayRecordSummaryAsPlainText } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { currentTable } from '@mathesar/stores/tables';

  import RecordPageContent from './RecordPageContent.svelte';
  import RecordPageLoadingSpinner from './RecordPageLoadingSpinner.svelte';
  import type RecordStore from './RecordStore';

  export let record: RecordStore;

  $: table = $currentTable as Table;
  $: tableStructure = new TableStructure({
    database: $currentDatabase,
    table,
    abstractTypesMap,
  });
  $: tableStructureIsLoading = tableStructure.isLoading;
  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: isLoading = $tableStructureIsLoading || recordStoreIsLoading;
  $: title = recordStoreIsLoading
    ? ''
    : displayRecordSummaryAsPlainText($summary);
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

<LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
  {#if isLoading}
    <RecordPageLoadingSpinner />
  {:else}
    <RecordPageContent {tableStructure} {record} />
  {/if}
</LayoutWithHeader>
