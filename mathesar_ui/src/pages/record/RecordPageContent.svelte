<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';
  import { Icon, Spinner } from '@mathesar/component-library';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { iconRecord } from '@mathesar/icons';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import { getAPI } from '@mathesar/utils/api';
  import DirectField from './DirectField.svelte';
  import type RecordStore from './RecordStore';
  import Widgets from './Widgets.svelte';

  export let record: RecordStore;
  export let tableStructure: TableStructure;

  $: table = $currentTable as TableEntry;
  $: ({ processedColumns } = tableStructure);
  $: ({ recordId, summary } = record);

  function getJoinableTablesResult(tableId: number) {
    return getAPI<JoinableTablesResult>(
      `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=1`,
    );
  }
</script>

<div><EntityType><Identifier>{table.name}</Identifier> Record</EntityType></div>
<h1><Icon {...iconRecord} />{$summary}</h1>

<section class="fields-section">
  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
    <DirectField {processedColumn} {record} />
  {/each}
</section>

<div class="widgets">
  {#await getJoinableTablesResult(table.id)}
    <Spinner />
  {:then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordId} />
  {/await}
</div>

<style>
  .fields-section {
    margin: 3rem 0;
    display: grid;
    grid-template-columns: auto 1fr;
  }
</style>
