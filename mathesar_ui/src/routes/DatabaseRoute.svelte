<script lang="ts">
  import { onMount } from 'svelte';
  import { Route } from 'tinro';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import DatabasePage from '@mathesar/pages/database/DatabasePage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { currentDBName, databases } from '@mathesar/stores/databases';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';
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
    <DatabasePage {database} />
  </Route>

  <Route path="/:schemaId/*" let:meta firstmatch>
    <SchemaRoute {database} schemaId={parseInt(meta.params.schemaId, 10)} />
  </Route>
{:else}
  <ErrorPage>
    <RichText text={$LL.routes.databaseWithNameNotFound()} let:slotName>
      {#if slotName === 'databaseName'}
        <Identifier>{databaseName}</Identifier>
      {/if}
    </RichText>
  </ErrorPage>
{/if}
