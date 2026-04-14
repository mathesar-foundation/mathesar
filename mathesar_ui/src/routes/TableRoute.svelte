<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import TablePage from '@mathesar/pages/table/TablePage.svelte';
  import { currentTableId, getTableFromApi } from '@mathesar/stores/tables';
  import AsyncStore from '@mathesar/stores/AsyncStore';

  import RecordPageRoute from './RecordPageRoute.svelte';

  export let database: Database;
  export let schema: Schema;
  export let tableId: number;
  const tableFetch = new AsyncStore(getTableFromApi);
  $: $currentTableId = tableId;
  $: void (async () => (await tableFetch.run({ tableOid: tableId })))();
  $: table = $tableFetch.resolvedValue;

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
    <RecordPageRoute {table} recordPk={String(meta.params.recordPk)} />
  </Route>
{:else}
  <ErrorPage>{$_('table_not_found')}</ErrorPage>
{/if}
