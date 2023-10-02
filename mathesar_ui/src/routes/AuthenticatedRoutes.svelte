<script lang="ts">
  import { Route } from 'tinro';
  import { databases } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import NoDatabaseFound from '@mathesar/pages/database/NoDatabaseFound.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';
  import { getDatabasePageUrl } from './urls';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: firstDatabase = $databases.successfulConnections?.[0];
</script>

{#if firstDatabase}
  <Route path="/" redirect={getDatabasePageUrl(firstDatabase.name)} />
{:else}
  <Route path="/">
    <NoDatabaseFound />
  </Route>
{/if}

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
