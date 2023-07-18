<script lang="ts">
  import { Route } from 'tinro';
  import type { CommonData } from '@mathesar/utils/preloadData';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { databases } from '@mathesar/stores/databases';
  import { setReleasesStoreInContext } from '@mathesar/stores/releases';
  import { setBreadcrumbItemsInContext } from '@mathesar/components/breadcrumb/breadcrumbUtils';
  import { setUserProfileStoreInContext } from '@mathesar/stores/userProfile';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';
  import { getDatabasePageUrl } from './urls';

  export let commonData: CommonData;

  $: userProfileStore = setUserProfileStoreInContext(commonData.user);
  $: userProfile = $userProfileStore;
  $: if (userProfile.isSuperUser) {
    // Toggle these lines to test with a mock tag name
    // setReleasesStoreInContext('1.75.0');
    setReleasesStoreInContext(commonData.current_release_tag_name);
  }

  setBreadcrumbItemsInContext([]);

  $: firstDatabase = $databases.data?.[0];
</script>

{#if firstDatabase}
  <Route path="/" redirect={getDatabasePageUrl(firstDatabase.name)} />
{:else}
  <Route path="/">
    <ErrorPage>No databases found</ErrorPage>
  </Route>
{/if}

<Route path="/profile">
  <UserProfileRoute />
</Route>

{#if userProfile.isSuperUser}
  <Route path="/administration/*" firstmatch>
    <AdminRoute />
  </Route>
{/if}

<Route path="/db/:databaseName/*" let:meta firstmatch>
  <DatabaseRoute databaseName={meta.params.databaseName} />
</Route>
