<script lang="ts">
  import type { Database } from '@mathesar/api/rpc/databases';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Table } from '@mathesar/api/rpc/tables';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import RecordStore from '@mathesar/pages/record/RecordStore';

  export let database: Database;
  export let schema: Schema;
  export let table: Table;
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
