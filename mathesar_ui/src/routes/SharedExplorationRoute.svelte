<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';
  import { preloadRouteData } from '@mathesar/utils/preloadData';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import ExplorationPage from '@mathesar/pages/exploration/ExplorationPage.svelte';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { queries } from '@mathesar/stores/queries';
  import { ShareConsumer } from '@mathesar/utils/shares';

  const routeSpecificData = preloadRouteData<{ query_id: number | null }>(
    'shared_query',
  );

  export let slug: string;

  $: queryId = routeSpecificData?.query_id ?? undefined;
  $: query = queryId ? $queries.data.get(queryId) : undefined;
  $: database = $currentDatabase;
  $: schema = $currentSchema;

  $: shareConsumer = new ShareConsumer({
    slug,
  });
</script>

<Route path="/">
  {#if query && database && schema}
    <ExplorationPage {database} {schema} {query} {shareConsumer} />
  {:else}
    <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
  {/if}
</Route>
