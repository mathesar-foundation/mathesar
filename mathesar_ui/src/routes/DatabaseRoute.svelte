<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import type { Connection } from '@mathesar/api/rest/connections';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { connectionsStore } from '@mathesar/stores/databases';

  import SchemaRoute from './SchemaRoute.svelte';

  export let connectionId: Connection['id'];

  $: connectionsStore.setCurrentConnectionId(connectionId);
  $: ({ connections } = connectionsStore);
  $: connection = $connections.get(connectionId);

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
    <RichText text={$_('database_not_found')} let:slotName>
      {#if slotName === 'connectionId'}
        <Identifier>{connectionId}</Identifier>
      {/if}
    </RichText>
  </ErrorPage>
{/if}
