<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import type { Database } from '@mathesar/api/rpc/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { databasesStore } from '@mathesar/stores/databases';

  import SchemaRoute from './SchemaRoute.svelte';

  export let databaseId: Database['id'];

  $: databasesStore.setCurrentDatabaseId(databaseId);
  const { currentDatabase } = databasesStore;

  function handleUnmount() {
    databasesStore.clearCurrentDatabaseId();
  }

  onMount(() => handleUnmount);
</script>

{#if $currentDatabase}
  <AppendBreadcrumb item={{ type: 'database', database: $currentDatabase }} />

  <Route path="/">
    <DatabasePage database={$currentDatabase} />
  </Route>

  <Route path="/:schemaId/*" let:meta firstmatch>
    <SchemaRoute
      database={$currentDatabase}
      schemaId={parseInt(meta.params.schemaId, 10)}
    />
  </Route>
{:else}
  <ErrorPage>
    <RichText text={$_('database_not_found')} let:slotName>
      {#if slotName === 'connectionId'}
        <Identifier>{databaseId}</Identifier>
      {/if}
    </RichText>
  </ErrorPage>
{/if}
