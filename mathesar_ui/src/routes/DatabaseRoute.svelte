<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import { ensureReadable } from '@mathesar/component-library';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import { CollaborationFeaturesContext } from '@mathesar/contexts/CollaborationFeaturesContext';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import type { Database } from '@mathesar/models/Database';
  import DatabasePageWrapper from '@mathesar/pages/database/DatabasePageWrapper.svelte';
  import DatabasePageSchemasSection from '@mathesar/pages/database/schemas/SchemasSection.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { databasesStore } from '@mathesar/stores/databases';
  import { canViewDbPermissionsAndSettings } from '@mathesar/utils/preloadData';

  import DatabaseSettingsRoute from './DatabaseSettingsRoute.svelte';
  import SchemaRoute from './SchemaRoute.svelte';

  export let databaseId: Database['id'];

  $: databasesStore.setCurrentDatabaseId(databaseId);
  const { currentDatabase } = databasesStore;
  const allowDbSettingsRoute = canViewDbPermissionsAndSettings();

  $: collabFeaturesContext = ensureReadable(
    $currentDatabase
      ? CollaborationFeaturesContext.construct($currentDatabase)
      : undefined,
  );
  $: databaseRouteContext = ensureReadable(
    $currentDatabase && $collabFeaturesContext
      ? DatabaseRouteContext.construct($currentDatabase, $collabFeaturesContext)
      : undefined,
  );

  function handleUnmount() {
    databasesStore.clearCurrentDatabaseId();
  }

  onMount(() => handleUnmount);
</script>

{#if $databaseRouteContext}
  <AppendBreadcrumb
    item={{ type: 'database', database: $databaseRouteContext.database }}
  />

  <Route path="/schemas/:schemaId/*" let:meta firstmatch>
    <SchemaRoute
      database={$databaseRouteContext.database}
      schemaId={parseInt(meta.params.schemaId, 10)}
    />
  </Route>

  <Route path="/*" firstmatch>
    <Route path="/" redirect="schemas/" />

    <DatabasePageWrapper let:setSection>
      <EventfulRoute path="/schemas" onLoad={() => setSection('schemas')}>
        <DatabasePageSchemasSection />
      </EventfulRoute>
      {#if allowDbSettingsRoute}
        <EventfulRoute
          path="/settings/*"
          onLoad={() => setSection('settings')}
          firstmatch
        >
          <DatabaseSettingsRoute />
        </EventfulRoute>
      {:else}
        <Route path="/settings/*" redirect="schemas/" />
      {/if}
    </DatabasePageWrapper>
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
