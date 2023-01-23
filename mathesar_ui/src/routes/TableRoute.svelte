<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import TablePage from '@mathesar/pages/table/TablePage.svelte';
  import { currentTableId, tables } from '@mathesar/stores/tables';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import RecordPageRoute from './RecordPageRoute.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let tableId: number;

  $: $currentTableId = tableId;
  $: table = $tables.data.get(tableId);

  function handleUnmount() {
    $currentTableId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if table}
  <AppendBreadcrumb item={{ type: 'table', database, schema, table }} />

  <Route path="/">
    <TablePage {table} />
  </Route>

  <Route path="/:recordId" let:meta>
    <RecordPageRoute
      {database}
      {schema}
      {table}
      recordId={parseInt(meta.params.recordId, 10)}
    />
  </Route>
{:else}
  <ErrorPage>Table with id {tableId} not found.</ErrorPage>
{/if}
