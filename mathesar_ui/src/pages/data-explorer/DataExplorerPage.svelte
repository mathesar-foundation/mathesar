<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';

  export let database: Database;
  export let schema: Schema;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.id, schema.oid));
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? $_('data_explorer'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer {queryManager} on:delete={gotoSchemaPage} />
</LayoutWithHeader>
