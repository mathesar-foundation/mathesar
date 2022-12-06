<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import type { TableEntry } from '@mathesar/api/tables';
  import RecordStore from '@mathesar/pages/record/RecordStore';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;
  export let recordId: number;

  $: record = new RecordStore({ table, recordId });
  $: ({ summary, fetchRequest } = record);
</script>

{#if $fetchRequest?.state === 'success'}
  <AppendBreadcrumb
    item={{
      type: 'record',
      database,
      schema,
      table,
      record: {
        id: recordId,
        summary: $summary,
      },
    }}
  />
{/if}
<RecordPage {record} />
