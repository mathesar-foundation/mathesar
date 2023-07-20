<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';
  import { preloadRouteData } from '@mathesar/utils/preloadData';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { currentTableId, tables } from '@mathesar/stores/tables';

  const routeSpecificData = preloadRouteData<{ table_id: number | null }>(
    'shared_table',
  );

  $: tableId = routeSpecificData?.table_id ?? undefined;
  $: $currentTableId = tableId ?? undefined;
  $: table = tableId ? $tables.data.get(tableId) : undefined;

  function handleUnmount() {
    $currentTableId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if table}
  <Route path="/">
    {table.name}
  </Route>
{:else}
  <ErrorPage>The page you're looking for doesn't exist.</ErrorPage>
{/if}
