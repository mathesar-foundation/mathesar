<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getExplorationPageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';

  const userProfile = getUserProfileStoreFromContext();

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);
  $: canEditMetadata =
    $userProfile?.hasPermission({ database, schema }, 'canEditMetadata') ??
    false;

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.id, schema.id));
  }

  function gotoExplorationPage() {
    if ($query.id) {
      router.goto(getExplorationPageUrl(database.id, schema.id, $query.id));
    }
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? $_('data_explorer'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer
    {queryManager}
    {canEditMetadata}
    on:close={gotoExplorationPage}
    on:delete={gotoSchemaPage}
  />
</LayoutWithHeader>
