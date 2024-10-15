<script lang="ts">
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import HomePage from '@mathesar/pages/home/HomePage.svelte';
  import WelcomePage from '@mathesar/pages/WelcomePage.svelte';
  import { HOME_URL, getDatabasePageUrl } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { mapExactlyOne } from '@mathesar/utils/iterUtils';

  import AdminRoute from './AdminRoute.svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';

  const { databases } = databasesStore;
  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: rootPathRedirectUrl = mapExactlyOne($databases, {
    whenZero: undefined,
    whenOne: ([id]) => getDatabasePageUrl(id),
    whenMany: HOME_URL,
  });
</script>

<Route path="/" redirect={rootPathRedirectUrl}>
  <!-- This page is rendered only when there are no existing connections -->
  <WelcomePage />
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

<Route path="/databases">
  <AppendBreadcrumb item={{ type: 'home' }} />
  <HomePage />
</Route>
