<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getExplorationPageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';

  export let database: Database;
  export let schema: Schema;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.id, schema.oid));
  }

  function gotoExplorationPage() {
    if ($query.id) {
      router.goto(getExplorationPageUrl(database.id, schema.oid, $query.id));
    }
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? $_('data_explorer'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer
    {queryManager}
    on:close={gotoExplorationPage}
    on:delete={gotoSchemaPage}
  />
</LayoutWithHeader>
