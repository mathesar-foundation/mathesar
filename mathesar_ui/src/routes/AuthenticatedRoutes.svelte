<script lang="ts">
  import { Route } from 'tinro';
  import { connectionsStore } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getDatabasePageUrl, CONNECTIONS_URL } from '@mathesar/routes/urls';
  import WelcomePage from '@mathesar/pages/WelcomePage.svelte';
  import ConnectionsPage from '@mathesar/pages/connections/ConnectionsPage.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: ({ connections } = connectionsStore);

  $: rootPathRedirectUrl = (() => {
    const numberOfConnections = $connections?.length ?? 0;
    if (numberOfConnections === 0) {
      // There is no redirection when `redirect` is `undefined`.
      return undefined;
    }
    if (numberOfConnections > 1) {
      return CONNECTIONS_URL;
    }
    const firstConnection = $connections[0];
    return getDatabasePageUrl(firstConnection.id);
  })();
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
