<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader2 from '@mathesar/layouts/LayoutWithHeader2.svelte';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import FaviconExplorer from '@mathesar/static-assets/encodedFavicons_DataExplorer.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? 'Data Explorer')}</title>
  <FaviconExplorer/>
</svelte:head>

<LayoutWithHeader2 fitViewport restrictWidth={false}>
  <DataExplorer {queryManager} on:delete={gotoSchemaPage} />
</LayoutWithHeader2>
