<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';

  export let queryManager: QueryManager;

  $: ({ query } = queryManager);
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? 'Data Explorer')}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataExplorer {queryManager} />
</LayoutWithHeader>
