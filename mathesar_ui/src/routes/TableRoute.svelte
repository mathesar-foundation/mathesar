<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import TablePage from '@mathesar/pages/table/TablePage.svelte';
  import { currentTableId, currentTablesData } from '@mathesar/stores/tables';

  import RecordPageRoute from './RecordPageRoute.svelte';

  export let database: Database;
  export let schema: Schema;
  export let tableId: number;

  $: $currentTableId = tableId;
  $: table = $currentTablesData.tablesMap.get(tableId);

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

  <Route path="/:recordPk" let:meta>
    <RecordPageRoute
      {database}
      {schema}
      {table}
      recordPk={String(meta.params.recordPk)}
    />
  </Route>
{:else}
  <ErrorPage>{$_('table_not_found')}</ErrorPage>
{/if}
