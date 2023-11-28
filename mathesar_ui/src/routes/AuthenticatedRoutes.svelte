<script lang="ts">
  import { Route } from 'tinro';
  import { databases } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getDatabasePageUrl, CONNECTIONS_URL } from '@mathesar/routes/urls';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';
  import ConnectionsRoute from './ConnectionsRoute.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: firstDatabase = $databases.data?.[0];
</script>

<Route
  path="/"
  redirect={firstDatabase
    ? getDatabasePageUrl(firstDatabase.nickname)
    : CONNECTIONS_URL}
/>

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
