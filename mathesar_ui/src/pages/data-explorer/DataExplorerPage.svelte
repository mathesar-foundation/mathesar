<script lang="ts">
  import LayoutWithHeader2 from '@mathesar/layouts/LayoutWithHeader2.svelte';
  import { DataExplorer } from '@mathesar/systems/data-explorer';
  import type { QueryManager } from '@mathesar/systems/data-explorer/types';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';

  export let queryManager: QueryManager;

  $: ({ query } = queryManager);
</script>

<svelte:head>
  <title>{makeSimplePageTitle($query.name ?? 'Data Explorer')}</title>
</svelte:head>

<LayoutWithHeader2 fitViewport restrictWidth={false}>
  <DataExplorer {queryManager} />
</LayoutWithHeader2>
