<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { currentDBName, databases } from '@mathesar/stores/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import SchemaRoute from './SchemaRoute.svelte';

  export let databaseName: string;

  $: $currentDBName = databaseName;
  $: database = $databases.data?.find((db) => db.name === databaseName);

  function handleUnmount() {
    $currentDBName = undefined;
  }

  onMount(() => handleUnmount);
</script>

{#if database}
  <AppendBreadcrumb item={{ type: 'database', database }} />

  <Route path="/">
    <DatabasePage />
  </Route>

  <Route path="/:schemaId/*" let:meta firstmatch>
    <SchemaRoute {database} schemaId={parseInt(meta.params.schemaId, 10)} />
  </Route>
{:else}
  <ErrorPage>
    Database not found with name <Identifier>databaseName</Identifier>.
  </ErrorPage>
{/if}
