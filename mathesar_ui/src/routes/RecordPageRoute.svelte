<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import type { Table } from '@mathesar/models/Table';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import RecordStore from '@mathesar/stores/RecordStore';

  export let table: Table;
  export let recordPk: string;

  $: record = new RecordStore({ table, recordPk });
  $: schema = table.schema;
  $: database = schema.database;
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
