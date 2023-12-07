<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { connectionsStore } from '@mathesar/stores/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import SchemaRoute from './SchemaRoute.svelte';

  export let databaseName: string;

  $: connectionsStore.setCurrentConnectionName(databaseName);
  $: ({ connections } = connectionsStore);
  $: connection = $connections?.find((conn) => conn.nickname === databaseName);

  function handleUnmount() {
    connectionsStore.clearCurrentConnectionName();
  }

  onMount(() => handleUnmount);
</script>

{#if connection}
  <AppendBreadcrumb item={{ type: 'database', database: connection }} />

  <Route path="/">
    <DatabasePage database={connection} />
  </Route>

  <Route path="/:schemaId/*" let:meta firstmatch>
    <SchemaRoute
      database={connection}
      schemaId={parseInt(meta.params.schemaId, 10)}
    />
  </Route>
{:else}
  <ErrorPage>
    Database with name <Identifier>{databaseName}</Identifier> is not found.
  </ErrorPage>
{/if}
