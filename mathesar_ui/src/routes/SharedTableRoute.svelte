<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import TablePage from '@mathesar/pages/table/TablePage.svelte';
  import { currentTableId, currentTablesData } from '@mathesar/stores/tables';
  import { preloadRouteData } from '@mathesar/utils/preloadData';
  import { ShareConsumer } from '@mathesar/utils/shares';

  const routeSpecificData = preloadRouteData<{ table_id: number | null }>(
    'shared_table',
  );

  export let slug: string;

  $: tableId = routeSpecificData?.table_id ?? undefined;
  $: $currentTableId = tableId ?? undefined;
  $: table = tableId ? $currentTablesData.tablesMap.get(tableId) : undefined;
  $: shareConsumer = new ShareConsumer({
    slug,
  });

  function handleUnmount() {
    $currentTableId = undefined;
  }

  onMount(() => handleUnmount);
</script>

<Route path="/">
  {#if table}
    <TablePage {table} {shareConsumer} />
  {:else}
    <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
  {/if}
</Route>
