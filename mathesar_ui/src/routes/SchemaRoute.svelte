<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import type { Database } from '@mathesar/AppTypes';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import SchemaPage from '@mathesar/pages/schema/SchemaPage.svelte';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
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
  <Route path="/">
    <SchemaPage {database} {schema} />
  </Route>

  <Route path="/import/*">
    <AppendBreadcrumb item={{ type: 'schema', database, schema }} />
    <ImportRoute {database} {schema} />
  </Route>

  <Route path="/data-explorer/*">
    <AppendBreadcrumb item={{ type: 'schema', database, schema }} />
    <DataExplorerRoute {database} {schema} />
  </Route>

  <Route path="/:tableId/*" let:meta firstmatch>
    <AppendBreadcrumb item={{ type: 'schema', database, schema }} />
    <TableRoute
      {database}
      {schema}
      tableId={parseInt(meta.params.tableId, 10)}
    />
  </Route>
{:else}
  <ErrorPage>Schema not found.</ErrorPage>
{/if}
