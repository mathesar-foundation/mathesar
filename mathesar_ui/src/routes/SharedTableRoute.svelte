<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';
  import { preloadRouteData } from '@mathesar/utils/preloadData';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import TablePage from '@mathesar/pages/table/TablePage.svelte';
  import { currentTableId, tables } from '@mathesar/stores/tables';
  import { ShareConsumer } from '@mathesar/utils/shares';

  const routeSpecificData = preloadRouteData<{ table_id: number | null }>(
    'shared_table',
  );

  export let slug: string;

  $: tableId = routeSpecificData?.table_id ?? undefined;
  $: $currentTableId = tableId ?? undefined;
  $: table = tableId ? $tables.data.get(tableId) : undefined;
  $: shareConsumer = new ShareConsumer({
    slug,
  });

  function handleUnmount() {
    $currentTableId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if table}
  <Route path="/">
    <TablePage {table} {shareConsumer} />
  </Route>
{:else}
  <ErrorPage>The page you're looking for doesn't exist.</ErrorPage>
{/if}
