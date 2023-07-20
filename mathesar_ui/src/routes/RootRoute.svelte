<script lang="ts">
  import { Route } from 'tinro';
  import type { CommonData } from '@mathesar/utils/preloadData';
  import { setBreadcrumbItemsInContext } from '@mathesar/components/breadcrumb/breadcrumbUtils';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import AuthenticatedRoutes from './AuthenticatedRoutes.svelte';
  import UnautheticatedRoutes from './UnautheticatedRoutes.svelte';

  setBreadcrumbItemsInContext([]);

  export let commonData: CommonData;
</script>

<Route path="/*" firstmatch>
  <UnautheticatedRoutes />

  {#if commonData.is_authenticated}
    <AuthenticatedRoutes {commonData} />
  {/if}

  <Route fallback>
    <ErrorPage>The page you're looking for doesn't exist.</ErrorPage>
  </Route>
</Route>
