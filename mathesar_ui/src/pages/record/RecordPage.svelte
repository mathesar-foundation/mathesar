<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { TableStructure } from '@mathesar/stores/table-data/TableStructure';
  import { currentTable } from '@mathesar/stores/tables';
  import RecordPageContent from './RecordPageContent.svelte';

  export let recordId: number;

  $: table = $currentTable as TableEntry;
  $: tableStructure = new TableStructure({
    id: table.id,
    abstractTypesMap: $currentDbAbstractTypes.data,
  });
  $: ({ isLoading } = tableStructure);
</script>

<LayoutWithHeader>
  {#if $isLoading}
    <Spinner />
  {:else}
    <RecordPageContent {tableStructure} {recordId} />
  {/if}
</LayoutWithHeader>
