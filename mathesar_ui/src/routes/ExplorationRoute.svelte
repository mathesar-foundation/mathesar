<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import ExplorationPage from '@mathesar/pages/exploration/ExplorationPage.svelte';
  import { queries } from '@mathesar/stores/queries';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryId: number;

  $: query = $queries.data.get(queryId);
</script>

{#if query}
  <AppendBreadcrumb
    item={{
      type: 'exploration',
      database,
      schema,
      query,
    }}
  />

  <ExplorationPage {database} {schema} {query} />
{:else if Number.isNaN(queryId)}
  <ErrorPage>{$LL.routes.urlNotFound()}</ErrorPage>
{:else}
  <ErrorPage>{$LL.routes.tableWithIdNotFound({ id: queryId })}</ErrorPage>
{/if}
