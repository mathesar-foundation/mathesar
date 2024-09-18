<script lang="ts">
  import type { Table } from '@mathesar/api/rpc/tables';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import RecordStore from '@mathesar/pages/record/RecordStore';

  export let database: Database;
  export let schema: Schema;
  export let table: Table;
  export let recordPk: string;

  $: record = new RecordStore({ database, table, recordPk });
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
