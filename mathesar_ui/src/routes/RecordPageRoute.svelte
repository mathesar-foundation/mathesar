<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import RecordSummary from '@mathesar/components/RecordSummary.svelte';
  import { iconRecord } from '@mathesar/icons';
  import RecordPage from '@mathesar/pages/record/RecordPage.svelte';
  import RecordStore from '@mathesar/pages/record/RecordStore';
  import { getRecordPageUrl } from './urls';

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
      type: 'simple',
      href: getRecordPageUrl(database.name, schema.id, table.id, recordId),
      label: { component: RecordSummary, props: { recordSummary: $summary } },
      icon: iconRecord,
    }}
  />
{/if}
<RecordPage {record} />
