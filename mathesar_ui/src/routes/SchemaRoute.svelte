<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import type { Database } from '@mathesar/AppTypes';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import SchemaPage from '@mathesar/pages/schema/SchemaPage.svelte';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import MultiPathRoute from '@mathesar/components/routing/MultiPathRoute.svelte';
  import DataExplorerRoute from './DataExplorerRoute.svelte';
  import TableRoute from './TableRoute.svelte';
  import ImportRoute from './ImportRoute.svelte';

  export let database: Database;
  export let schemaId: number;

  $: $currentSchemaId = schemaId;
  $: schema = $schemas.data.get(schemaId);

  function handleUnmount() {
    $currentSchemaId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if schema}
  <AppendBreadcrumb item={{ type: 'schema', database, schema }} />

  <Route path="/import/*" firstmatch>
    <ImportRoute {database} {schema} />
  </Route>

  <Route path="/tables/:tableId/*" let:meta firstmatch>
    <TableRoute
      {database}
      {schema}
      tableId={parseInt(meta.params.tableId, 10)}
    />
  </Route>

  <MultiPathRoute
    paths={[
      { name: 'edit-exploration', path: '/explorations/:queryId' },
      { name: 'new-exploration', path: '/data-explorer/' },
    ]}
    let:path
    let:meta
  >
    <DataExplorerRoute
      {database}
      {schema}
      queryId={path === 'edit-exploration'
        ? parseInt(meta.params.queryId, 10)
        : undefined}
    />
  </MultiPathRoute>

  <MultiPathRoute
    paths={[
      { name: 'tables', path: '/tables/' },
      { name: 'explorations', path: '/explorations/' },
      { name: 'overview', path: '/' },
    ]}
    let:path
  >
    <SchemaPage {database} {schema} section={path} />
  </MultiPathRoute>
{:else}
  <ErrorPage>Schema not found.</ErrorPage>
{/if}
