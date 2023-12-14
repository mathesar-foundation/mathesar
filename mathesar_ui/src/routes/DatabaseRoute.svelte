<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import type { Connection } from '@mathesar/api/connections';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import { connectionsStore } from '@mathesar/stores/databases';
  import SchemaRoute from './SchemaRoute.svelte';

  export let connectionId: Connection['id'];

  $: connectionsStore.setCurrentConnectionId(connectionId);
  $: ({ connections } = connectionsStore);
  $: connection = $connections?.find((c) => c.id === connectionId);

  function handleUnmount() {
    connectionsStore.clearCurrentConnectionId();
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
    Database with name <Identifier>{connectionId}</Identifier> is not found.
  </ErrorPage>
{/if}
