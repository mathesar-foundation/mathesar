<script lang="ts">
  import { Route } from 'tinro';

  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import DatabaseCollaborators from '@mathesar/pages/database/settings/collaborators/Collaborators.svelte';
  import DatabaseRoleConfiguration from '@mathesar/pages/database/settings/role-configuration/RoleConfiguration.svelte';
  import DatabaseRoles from '@mathesar/pages/database/settings/roles/Roles.svelte';
  import DatabasePageSettingsWrapper from '@mathesar/pages/database/settings/SettingsWrapper.svelte';

  const databaseContext = DatabaseRouteContext.get();
  $: DatabaseSettingsRouteContext.construct($databaseContext);
</script>

<DatabasePageSettingsWrapper let:setSection>
  <Route path="/" redirect="role-configuration/" />
  <EventfulRoute
    path="/role-configuration"
    onLoad={() => setSection('roleConfiguration')}
  >
    <DatabaseRoleConfiguration />
  </EventfulRoute>
  <EventfulRoute
    path="/collaborators"
    onLoad={() => setSection('collaborators')}
  >
    <DatabaseCollaborators />
  </EventfulRoute>
  <EventfulRoute path="/roles" onLoad={() => setSection('roles')}>
    <DatabaseRoles />
  </EventfulRoute>
</DatabasePageSettingsWrapper>
