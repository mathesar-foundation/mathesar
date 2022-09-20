<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import QueryBuilder from '@mathesar/systems/query-builder/QueryBuilder.svelte';
  import type QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  function gotoSchema() {
    const schemaURL = getSchemaPageUrl(database.name, schema.id);
    router.goto(schemaURL);
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? 'Data Explorer')}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <QueryBuilder {queryManager} on:close={gotoSchema} />
</LayoutWithHeader>
