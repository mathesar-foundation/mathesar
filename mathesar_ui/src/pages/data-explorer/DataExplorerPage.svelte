<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { DataExplorer } from '@mathesar/systems/query-builder';
  import type { QueryManager } from '@mathesar/systems/query-builder/types';

  export let schema: SchemaEntry;
  export let queryManager: QueryManager;

  $: ({ query } = queryManager);
</script>

<svelte:head>
  <title>{$query.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer {queryManager} />
</LayoutWithHeader>
