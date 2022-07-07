<script lang="ts">
  import type { TinroRouteMeta } from 'tinro';
  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import QueryBuilder from '@mathesar/systems/query-builder/QueryBuilder.svelte';
  import QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import QueryModel from '@mathesar/systems/query-builder/QueryModel';

  const queryManager = new QueryManager(
    new QueryModel({ name: 'Untitled(0)' }),
  );

  function newQuery() {
    // Create new manager
  }

  function loadQueryById() {
    // Check query Id
    // If it doesn't match, fetch the correct one and create new manager for it
  }

  function newQueryRouteLoaded(meta: TinroRouteMeta) {
    console.log('NEW query route loaded', meta.params);
  }

  function savedQueryRouteLoaded(meta: TinroRouteMeta) {
    console.log('SAVED query route loaded', meta.params);
  }
</script>

<EventfulRoute
  path="/"
  on:routeUpdated={(e) => newQueryRouteLoaded(e.detail)}
/>
<EventfulRoute
  path="/:queryId"
  on:routeUpdated={(e) => savedQueryRouteLoaded(e.detail)}
/>

<QueryBuilder {queryManager} />
