<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import RecordStore from '@mathesar/pages/record/RecordStore';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;
  export let recordPk: string;

  $: record = new RecordStore({ table, recordPk });
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
        pk: recordPk,
        summary: $summary,
      },
    }}
  />
{/if}
<RecordPage {record} />
