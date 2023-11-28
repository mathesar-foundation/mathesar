<script lang="ts">
  import { Route } from 'tinro';
  import { databases } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getDatabasePageUrl, CONNECTIONS_URL } from '@mathesar/routes/urls';
  import WelcomePage from '@mathesar/pages/WelcomePage.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';
  import ConnectionsRoute from './ConnectionsRoute.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: rootPathRedirectUrl = (() => {
    const numberOfConnections = $databases.data?.length ?? 0;
    if (numberOfConnections === 0) {
      // There is no redirection when `redirect` is `undefined`.
      return undefined;
    }
    if (numberOfConnections > 1) {
      return CONNECTIONS_URL;
    }
    const firstConnection = $databases.data[0];
    return getDatabasePageUrl(firstConnection.nickname);
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

<Route path="/db/:databaseName/*" let:meta firstmatch>
  <DatabaseRoute databaseName={decodeURIComponent(meta.params.databaseName)} />
</Route>

<Route path="/connections">
  <ConnectionsRoute />
</Route>
