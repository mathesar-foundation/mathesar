<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import MultiPathRoute from '@mathesar/components/routing/MultiPathRoute.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import type { Database } from '@mathesar/models/Database';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import SchemaPage from '@mathesar/pages/schema/SchemaPage.svelte';
  import { currentSchemaId, schemas } from '@mathesar/stores/schemas';
  import { ensureReadable } from '@mathesar-component-library';

  import DataExplorerRedirect from './DataExplorerRedirect.svelte';
  import DataExplorerRoute from './DataExplorerRoute.svelte';
  import DataFormRoute from './DataFormRoute.svelte';
  import ImportRoute from './ImportRoute.svelte';
  import TableRoute from './TableRoute.svelte';

  export let database: Database;
  export let schemaId: number;

  $: $currentSchemaId = schemaId;
  $: schema = $schemas.data.get(schemaId);

  $: schemaRouteContext = schema
    ? SchemaRouteContext.construct(schema)
    : ensureReadable(undefined);

  function handleUnmount() {
    $currentSchemaId = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if $schemaRouteContext && schema}
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

  <Route path="/explorations/:queryId/edit" let:meta>
    <DataExplorerRedirect
      {database}
      {schema}
      query={{ id: parseInt(meta.params.queryId, 10) }}
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

  <Route path="/forms/:formId/*" firstmatch let:meta>
    <DataFormRoute formId={parseInt(meta.params.formId, 10)} />
  </Route>

  <Route path="/">
    <SchemaPage />
  </Route>
{:else}
  <ErrorPage>{$_('schema_not_found')}</ErrorPage>
{/if}
