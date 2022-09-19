<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryId: number;
</script>

<svelte:head>
  <title>Exploration Name comes here | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <div>Exploration Page - yet to be implemented</div>

  <div>
    <a href={getExplorationEditorPageUrl(database.name, schema.id, queryId)}
      >Edit exploration in Data Explorer</a
    >
  </div>
</LayoutWithHeader>
