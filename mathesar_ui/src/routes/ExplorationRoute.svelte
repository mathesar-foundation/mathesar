<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import ExplorationPage from '@mathesar/pages/exploration/ExplorationPage.svelte';
  import { queries } from '@mathesar/stores/queries';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';

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
{:else}
  <ErrorPage>The page you're looking for doesn't exist.</ErrorPage>
{/if}
