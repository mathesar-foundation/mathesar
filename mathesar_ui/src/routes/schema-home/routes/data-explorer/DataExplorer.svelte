<script lang="ts">
  import { router } from 'tinro';
  import type { TinroRouteMeta } from 'tinro';
  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import QueryBuilder from '@mathesar/systems/query-builder/QueryBuilder.svelte';
  import QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import QueryModel from '@mathesar/systems/query-builder/QueryModel';
  import { queries, getQuery } from '@mathesar/stores/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { CancellablePromise } from '@mathesar/component-library';
  import type { QueryInstance } from '@mathesar/api/queries/queryList';
  import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';

  export let database: string;
  export let schemaId: number;

  $: schemaURL = `/${database}/${String(schemaId)}/`;

  let is404 = false;

  let queryManager: QueryManager | undefined;
  let queryLoadPromise: CancellablePromise<QueryInstance | undefined>;

  function createQueryManager(queryInstance: UnsavedQueryInstance) {
    queryManager?.destroy();
    queryManager = new QueryManager(
      new QueryModel(queryInstance),
      $currentDbAbstractTypes.data,
    );
    is404 = false;
    queryManager.on('save', async (instance) => {
      try {
        const url = `${String(schemaURL)}queries/${instance.id}/`;
        router.goto(url, true);
      } catch (err) {
        console.error('There was an error when updating the URL', err);
      }
    });
  }

  function removeQueryManager(): void {
    queryManager?.destroy();
    is404 = true;
    queryManager = undefined;
  }

  function createNewQuery() {
    if (
      queryManager &&
      typeof queryManager.getQueryModelData().id === 'undefined'
    ) {
      // An unsaved query is already open
      return;
    }
    createQueryManager({
      name: getAvailableName(
        'New_Exploration',
        new Set([...$queries.data.values()].map((e) => e.name)),
      ),
    });
  }

  async function loadSavedQuery(meta: TinroRouteMeta) {
    const queryId = parseInt(meta.params.queryId, 10);
    if (!Number.isNaN(queryId)) {
      if (queryManager && queryManager.getQueryModelData().id === queryId) {
        // The requested query is already open
        return;
      }

      queryLoadPromise?.cancel();
      queryLoadPromise = getQuery(queryId);
      const queryInstance = await queryLoadPromise;
      if (queryInstance) {
        createQueryManager(queryInstance);
        return;
      }
    }
    removeQueryManager();
  }

  function gotoSchema() {
    router.goto(schemaURL);
  }
</script>

<EventfulRoute
  path="/:queryId"
  on:routeUpdated={(e) => loadSavedQuery(e.detail)}
  on:routeLoaded={(e) => loadSavedQuery(e.detail)}
/>
<EventfulRoute
  path="/"
  on:routeUpdated={createNewQuery}
  on:routeLoaded={createNewQuery}
/>

{#if queryManager}
  <QueryBuilder {queryManager} on:close={gotoSchema} />
{:else if is404}
  404 - Query not found
{:else}
  Loading
{/if}
