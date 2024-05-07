<script lang="ts">
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import ConnectionsPage from '@mathesar/pages/connections/ConnectionsPage.svelte';
  import WelcomePage from '@mathesar/pages/WelcomePage.svelte';
  import { CONNECTIONS_URL, getDatabasePageUrl } from '@mathesar/routes/urls';
  import { connectionsStore } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { mapExactlyOne } from '@mathesar/utils/iterUtils';

  import AdminRoute from './AdminRoute.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: ({ connections } = connectionsStore);

  $: rootPathRedirectUrl = mapExactlyOne($connections, {
    whenZero: undefined,
    whenOne: ([id]) => getDatabasePageUrl(id),
    whenMany: CONNECTIONS_URL,
  });
</script>

<Route path="/" redirect={rootPathRedirectUrl}>
  <!-- This page is rendered only when there are no existing connections -->
  <WelcomePage />
</Route>

<Route path="/profile">
  <UserProfileRoute />
</Route>

{#if userProfile?.isSuperUser}
  <Route path="/administration/*" firstmatch>
    <AdminRoute />
  </Route>
{/if}

<Route path="/db/:connectionId/*" let:meta firstmatch>
  <DatabaseRoute connectionId={parseInt(meta.params.connectionId, 10)} />
</Route>

<Route path="/connections">
  <AppendBreadcrumb item={{ type: 'connectionList' }} />
  <ConnectionsPage />
</Route>
