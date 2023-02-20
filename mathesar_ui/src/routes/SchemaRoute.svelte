<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import type { Database } from '@mathesar/AppTypes';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import SchemaPage from '@mathesar/pages/schema/SchemaPage.svelte';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import MultiPathRoute from '@mathesar/components/routing/MultiPathRoute.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import DataExplorerRoute from './DataExplorerRoute.svelte';
  import TableRoute from './TableRoute.svelte';
  import ImportRoute from './ImportRoute.svelte';
  import ExplorationRoute from './ExplorationRoute.svelte';

  const userProfile = getUserProfileStoreFromContext();

  export let database: Database;
  export let schemaId: number;

  $: $currentSchemaId = schemaId;
  $: schema = $schemas.data.get(schemaId);
  $: canExecuteDDL = $userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );

  function handleUnmount() {
    $currentSchemaId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if schema}
  <AppendBreadcrumb item={{ type: 'schema', database, schema }} />

  {#if canExecuteDDL}
    <Route path="/import/*" firstmatch>
      <ImportRoute {database} {schema} />
    </Route>
  {/if}

  <Route path="/tables/:tableId/*" let:meta firstmatch>
    <TableRoute
      {database}
      {schema}
      tableId={parseInt(meta.params.tableId, 10)}
    />
  </Route>

  <Route path="/explorations/:queryId" let:meta firstmatch>
    <ExplorationRoute
      {database}
      {schema}
      queryId={parseInt(meta.params.queryId, 10)}
    />
  </Route>

  <MultiPathRoute
    paths={[
      { name: 'edit-exploration', path: '/explorations/:queryId/edit/' },
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
