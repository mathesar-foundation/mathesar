<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';
  import type { CommonData } from '@mathesar/utils/preloadData';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import RouteObserver from '@mathesar/components/routing/RouteObserver.svelte';
  import AuthenticatedRoutes from './AuthenticatedRoutes.svelte';
  import AnonymousAccessRoutes from './AnonymousAccessRoutes.svelte';

  export let commonData: CommonData;
</script>

<!--
  We're explicity having two separate routing context for the app to avoid the user
  from client routing across either of them.
-->

{#if commonData.routing_context === 'anonymous'}
  <Route path="/*" firstmatch>
    <Route path="/shares/*" firstmatch>
      <AnonymousAccessRoutes />

      <Route fallback>
        <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
      </Route>
    </Route>

    <Route fallback>
      <!--Reload page to let server routing take over-->
      <RouteObserver on:load={() => window.location.reload()} />
    </Route>
  </Route>
{:else}
  <Route path="/*" firstmatch>
    {#if commonData.is_authenticated}
      <AuthenticatedRoutes />
    {/if}

    <Route path="/shares/*">
      <!--Reload page to let server routing take over-->
      <RouteObserver on:load={() => window.location.reload()} />
    </Route>

    <Route fallback>
      <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
    </Route>
  </Route>
{/if}
