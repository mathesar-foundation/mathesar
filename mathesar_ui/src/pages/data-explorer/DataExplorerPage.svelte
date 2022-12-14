<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getSchemaPageUrl,
    getExplorationPageUrl,
  } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }

  function gotoExplorationPage() {
    if ($query.id) {
      router.goto(getExplorationPageUrl(database.name, schema.id, $query.id));
    }
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? 'Data Explorer')}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer
    {queryManager}
    on:close={gotoExplorationPage}
    on:delete={gotoSchemaPage}
  />
</LayoutWithHeader>
