<script lang="ts">
  import { router } from 'tinro';
  import type { TinroRouteMeta } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import EventfulRoute from '@mathesar/components/routing/EventfulRoute.svelte';
  import QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import QueryModel from '@mathesar/systems/query-builder/QueryModel';
  import { queries, getQuery } from '@mathesar/stores/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { CancellablePromise } from '@mathesar/component-library';
  import type { QueryInstance } from '@mathesar/api/queries/queryList';
  import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';
  import DataExplorerPage from '@mathesar/pages/data-explorer/DataExplorerPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;

  let is404 = false;

  let queryManager: QueryManager | undefined;
  let queryLoadPromise: CancellablePromise<QueryInstance>;

  function createQueryManager(queryInstance: UnsavedQueryInstance) {
    queryManager?.destroy();
    queryManager = new QueryManager(
      new QueryModel(queryInstance),
      $currentDbAbstractTypes.data,
    );
    is404 = false;
    queryManager.on('save', async (instance) => {
      try {
        const url = getDataExplorerPageUrl(
          database.name,
          schema.id,
          instance.id,
        );
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
      typeof queryManager.getQueryModel().id === 'undefined'
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
    if (Number.isNaN(queryId)) {
      removeQueryManager();
      return;
    }

    if (queryManager && queryManager.getQueryModel().id === queryId) {
      // The requested query is already open
      return;
    }

    queryLoadPromise?.cancel();
    queryLoadPromise = getQuery(queryId);
    try {
      const queryInstance = await queryLoadPromise;
      createQueryManager(queryInstance);
    } catch {
      // TODO: Display 404 or other error message based on API response
      removeQueryManager();
    }
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

<!--TODO: Add loading state-->

{#if queryManager}
  <DataExplorerPage {database} {schema} {queryManager} />
{:else if is404}
  <ErrorPage>Exploration not found.</ErrorPage>
{/if}
