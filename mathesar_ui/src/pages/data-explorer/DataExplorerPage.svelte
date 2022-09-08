<script lang="ts">
  import { meta, router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import QueryBuilder from '@mathesar/systems/query-builder/QueryBuilder.svelte';
  import type QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  const routeMeta = meta();

  $: ({ query } = queryManager);

  function goBackWithFallbackToSchema() {
    const schemaURL = getSchemaPageUrl(database.name, schema.id);
    router.goto($routeMeta.from || schemaURL);
  }
</script>

<svelte:head>
  <title>{$query.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <QueryBuilder {queryManager} on:close={goBackWithFallbackToSchema} />
</LayoutWithHeader>
