<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    QueryManager,
    QueryModel,
    constructQueryModelFromHash,
  } from '@mathesar/systems/data-explorer';
  import { getQuery } from '@mathesar/stores/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { CancellablePromise } from '@mathesar/component-library';
  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
  import DataExplorerPage from '@mathesar/pages/data-explorer/DataExplorerPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import {
    getDataExplorerPageUrl,
    getExplorationEditorPageUrl,
  } from '@mathesar/routes/urls';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconEdit, iconExploration } from '@mathesar/icons';
  import { readable, type Readable } from 'svelte/store';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryId: number | undefined;

  let is404 = false;

  let queryManager: QueryManager | undefined;
  let queryLoadPromise: CancellablePromise<QueryInstance>;
  let query: Readable<QueryModel | undefined> = readable(undefined);

  function createQueryManager(queryInstance: UnsavedQueryInstance) {
    queryManager?.destroy();
    queryManager = new QueryManager({
      query: new QueryModel(queryInstance),
      abstractTypeMap: $currentDbAbstractTypes.data,
      onSave: async (instance) => {
        try {
          const url = getExplorationEditorPageUrl(
            database.id,
            schema.id,
            instance.id,
          );
          router.goto(url, true);
        } catch (err) {
          console.error('There was an error when updating the URL', err);
        }
      },
    });
    query = queryManager.query;
    is404 = false;
  }

  function removeQueryManager(): void {
    queryManager?.destroy();
    is404 = true;
    query = readable(undefined);
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
    const { hash } = $router;
    if (hash) {
      try {
        const newQueryModel = constructQueryModelFromHash(hash);
        router.location.hash.clear();
        createQueryManager(newQueryModel ?? {});
        return;
      } catch {
        // fail silently
        console.error('Unable to create query model from hash', hash);
      }
    }
    createQueryManager({});
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
  {#if $query.name}
    <AppendBreadcrumb
      item={{
        type: 'exploration',
        database,
        schema,
        query: {
          id: $query.id,
          name: $query.name,
        },
      }}
    />
    <AppendBreadcrumb
      item={{
        type: 'simple',
        href: getExplorationEditorPageUrl(database.id, schema.id, $query.id),
        label: $_('edit'),
        icon: iconEdit,
      }}
    />
  {:else}
    <AppendBreadcrumb
      item={{
        type: 'simple',
        href: getExplorationEditorPageUrl(database.id, schema.id, $query.id),
        label: $_('data_explorer'),
        icon: iconExploration,
      }}
    />
  {/if}
{:else}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getDataExplorerPageUrl(database.id, schema.id),
      label: $_('data_explorer'),
      icon: iconExploration,
    }}
  />
{/if}

<!--TODO: Add loading state-->

{#if queryManager}
  <DataExplorerPage {queryManager} {database} {schema} />
{:else if is404}
  <ErrorPage>{$_('exploration_not_found')}</ErrorPage>
{/if}
