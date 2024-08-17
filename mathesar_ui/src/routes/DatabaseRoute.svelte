<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import type { Database } from '@mathesar/models/Database';
  import DatabasePageWrapper from '@mathesar/pages/database/DatabasePageWrapper.svelte';
  import DatabasePageSchemasSection from '@mathesar/pages/database/schemas/SchemasSection.svelte';
  import DatabaseCollaborators from '@mathesar/pages/database/settings/Collaborators.svelte';
  import DatabaseRoleConfiguration from '@mathesar/pages/database/settings/role-configuration/RoleConfiguration.svelte';
  import DatabaseRoles from '@mathesar/pages/database/settings/Roles.svelte';
  import DatabasePageSettingsWrapper from '@mathesar/pages/database/settings/SettingsWrapper.svelte';
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

  <Route path="/schemas/:schemaId/*" let:meta firstmatch>
    <SchemaRoute
      database={$currentDatabase}
      schemaId={parseInt(meta.params.schemaId, 10)}
    />
  </Route>

  <Route path="/*" firstmatch>
    <Route path="/" redirect="schemas/" />

    <DatabasePageWrapper database={$currentDatabase} let:setSection>
      <EventfulRoute path="/schemas" onLoad={() => setSection('schemas')}>
        <DatabasePageSchemasSection database={$currentDatabase} />
      </EventfulRoute>
      <EventfulRoute
        path="/settings/*"
        onLoad={() => setSection('settings')}
        firstmatch
      >
        <DatabasePageSettingsWrapper
          database={$currentDatabase}
          let:setSection={setSettingsSection}
        >
          <Route path="/" redirect="role-configuration/" />
          <EventfulRoute
            path="/role-configuration"
            onLoad={() => setSettingsSection('roleConfiguration')}
          >
            <DatabaseRoleConfiguration />
          </EventfulRoute>
          <EventfulRoute
            path="/collaborators"
            onLoad={() => setSettingsSection('collaborators')}
          >
            <DatabaseCollaborators />
          </EventfulRoute>
          <EventfulRoute
            path="/roles"
            onLoad={() => setSettingsSection('roles')}
          >
            <DatabaseRoles />
          </EventfulRoute>
        </DatabasePageSettingsWrapper>
      </EventfulRoute>
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
