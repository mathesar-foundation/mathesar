<script lang="ts">
  import { Route } from 'tinro';

  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { databases } from '@mathesar/stores/databases';
  import { setBreadcrumbItemsInContext } from '@mathesar/components/breadcrumb/breadcrumbUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import DatabaseRoute from './DatabaseRoute.svelte';
  import UserProfileRoute from './UserProfileRoute.svelte';
  import AdminRoute from './AdminRoute.svelte';
  import { getDatabasePageUrl } from './urls';

  setBreadcrumbItemsInContext([]);

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  $: firstDatabase = $databases.data?.[0];
</script>

<Route path="/*" firstmatch>
  {#if firstDatabase}
    <Route path="/" redirect={getDatabasePageUrl(firstDatabase.name)} />
  {:else}
    <Route path="/">
      <ErrorPage>{$LL.routes.noDatabasesFound()}</ErrorPage>
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
    <DatabaseRoute databaseName={meta.params.databaseName} />
  </Route>

  <Route fallback>
    <ErrorPage>{$LL.routes.wrongWebPage()}</ErrorPage>
  </Route>
</Route>
