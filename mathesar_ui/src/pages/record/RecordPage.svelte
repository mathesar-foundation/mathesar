<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { TableStructure } from '@mathesar/stores/table-data/TableStructure';
  import { currentTable } from '@mathesar/stores/tables';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import RecordPageContent from './RecordPageContent.svelte';
  import type RecordStore from './RecordStore';

  export let record: RecordStore;

  $: table = $currentTable as TableEntry;
  $: tableStructure = new TableStructure({
    id: table.id,
    abstractTypesMap: $currentDbAbstractTypes.data,
  });
  $: ({ isLoading: tableStructureIsLoading } = tableStructure);
  $: ({ fetchRequest: recordStoreFetchRequest, summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: isLoading = $tableStructureIsLoading || recordStoreIsLoading;
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

<LayoutWithHeader>
  {#if isLoading}
    <Spinner />
  {:else}
    <RecordPageContent {tableStructure} {record} />
  {/if}
</LayoutWithHeader>
