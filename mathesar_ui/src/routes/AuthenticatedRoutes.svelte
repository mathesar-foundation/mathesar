<script lang="ts">
  import { Route } from 'tinro';

  import HomePage from '@mathesar/pages/home/HomePage.svelte';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';

  import AdminRoute from './AdminRoute.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
</script>

<Route path="/">
  <HomePage />
</Route>

<Route path="/profile">
  <UserProfileRoute />
</Route>

{#if userProfile?.isMathesarAdmin}
  <Route path="/administration/*" firstmatch>
    <AdminRoute />
  </Route>
{/if}

<Route path="/db/:databaseId/*" let:meta firstmatch>
  <DatabaseRoute databaseId={parseInt(meta.params.databaseId, 10)} />
</Route>
