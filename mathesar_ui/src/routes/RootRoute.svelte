<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import RouteObserver from '@mathesar/components/routing/RouteObserver.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import type { CommonData } from '@mathesar/utils/preloadData';

  import AnonymousAccessRoutes from './AnonymousAccessRoutes.svelte';
  import AuthenticatedRoutes from './AuthenticatedRoutes.svelte';

  export let commonData: CommonData;

  function gotoLoginPage() {
    window.location.href = '/auth/login/?next=/';
  }
</script>

<Route path="/*" firstmatch>
  {#if commonData.is_authenticated}
    <AuthenticatedRoutes />
  {:else}
    <Route path="/" let:meta>
      <RouteObserver {meta} onLoadAlways={gotoLoginPage} />
    </Route>
  {/if}

  <Route path="/shares/*" firstmatch>
    <AnonymousAccessRoutes />

    <Route fallback>
      <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
    </Route>
  </Route>

  <Route fallback>
    <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
  </Route>
</Route>
