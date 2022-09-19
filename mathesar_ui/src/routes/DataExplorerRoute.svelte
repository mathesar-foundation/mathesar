<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import QueryModel from '@mathesar/systems/query-builder/QueryModel';
  import { queries, getQuery } from '@mathesar/stores/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { CancellablePromise } from '@mathesar/component-library';
  import type { QueryInstance } from '@mathesar/api/queries';
  import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';
  import DataExplorerPage from '@mathesar/pages/data-explorer/DataExplorerPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import {
    getDataExplorerPageUrl,
    getExplorationPageUrl,
  } from '@mathesar/routes/urls';
  import { constructQueryModelFromTerseSummarizationHash } from '@mathesar/systems/query-builder/urlSerializationUtils';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconExploration } from '@mathesar/icons';
  import { readable } from 'svelte/store';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryId: number | undefined;

  let is404 = false;

  let queryManager: QueryManager | undefined;
  let queryLoadPromise: CancellablePromise<QueryInstance>;

  $: ({ query } = queryManager ?? { query: readable(undefined) });

  function createQueryManager(queryInstance: UnsavedQueryInstance) {
    queryManager?.destroy();
    queryManager = new QueryManager(
      new QueryModel(queryInstance),
      $currentDbAbstractTypes.data,
    );
    is404 = false;
    // queryManager.on('save', async (instance) => {
    //   try {
    //     const url = getDataExplorerPageUrl(
    //       database.name,
    //       schema.id,
    //       instance.id,
    //     );
    //     router.goto(url, true);
    //   } catch (err) {
    //     console.error('There was an error when updating the URL', err);
    //   }
    // });
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
    let newQueryModel = {
      name: getAvailableName(
        'New_Exploration',
        new Set([...$queries.data.values()].map((e) => e.name)),
      ),
    };
    const { hash } = $router;
    if (hash) {
      try {
        newQueryModel = {
          ...newQueryModel,
          ...constructQueryModelFromTerseSummarizationHash(hash),
        };
        router.location.hash.clear();
        createQueryManager(newQueryModel);
        return;
      } catch {
        // fail silently
        console.error('Unable to create query model from hash', hash);
      }
    }
    createQueryManager(newQueryModel);
  }

  async function loadSavedQuery(_queryId: number) {
    if (Number.isNaN(_queryId)) {
      removeQueryManager();
      return;
    }

    if (queryManager && queryManager.getQueryModel().id === _queryId) {
      // The requested query is already open
      return;
    }

    queryLoadPromise?.cancel();
    queryLoadPromise = getQuery(_queryId);
    try {
      const queryInstance = await queryLoadPromise;
      createQueryManager(queryInstance);
    } catch {
      // TODO: Display 404 or other error message based on API response
      removeQueryManager();
    }
  }

  function createOrLoadQuery(_queryId?: number) {
    if (_queryId) {
      void loadSavedQuery(_queryId);
    } else {
      createNewQuery();
    }
  }

  $: createOrLoadQuery(queryId);
</script>

{#if $query?.id}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getExplorationPageUrl(database.name, schema.id, $query.id),
      label: $query?.name ?? 'Data Explorer',
      icon: iconExploration,
    }}
  />
{:else}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getDataExplorerPageUrl(database.name, schema.id),
      label: 'Data Explorer',
      icon: iconExploration,
    }}
  />
{/if}

<!--TODO: Add loading state-->

{#if queryManager}
  <DataExplorerPage {schema} {queryManager} />
{:else if is404}
  <ErrorPage>Exploration not found.</ErrorPage>
{/if}
