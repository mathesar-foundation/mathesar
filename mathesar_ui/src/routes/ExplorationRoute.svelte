<script lang="ts">
  import { readable } from 'svelte/store';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import type QueryManager from '@mathesar/systems/query-builder/QueryManager';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { getExplorationPageUrl } from '@mathesar/routes/urls';
  import { iconExploration } from '@mathesar/icons';

  export let database: Database;
  export let schema: SchemaEntry;
  export let queryId: number;

  let queryManager: QueryManager | undefined;

  $: ({ query } = queryManager ?? { query: readable(undefined) });
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getExplorationPageUrl(database.name, schema.id, queryId),
    label: $query?.name ?? 'Data Explorer',
    icon: iconExploration,
  }}
/>

Exploration Page
