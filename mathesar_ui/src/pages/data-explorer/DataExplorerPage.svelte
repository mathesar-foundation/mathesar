<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import QueryBuilder from '@mathesar/systems/query-builder/QueryBuilder.svelte';
  import type QueryManager from '@mathesar/systems/query-builder/QueryManager';

  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);
</script>

<svelte:head>
  <title>{$query.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <QueryBuilder {queryManager} />
</LayoutWithHeader>
