<script lang="ts">
  import type { Database } from '@mathesar/api/rpc/databases';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';

  import DatabaseDetails from './DatabaseDetails.svelte';

  export let database: Database;
</script>

<svelte:head>
  <title>{makeSimplePageTitle(database.name)}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth={true}
  cssVariables={{
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--AppSecondaryHeader__padding': 'var(--size-x-large) 0',
  }}
>
  {#key database.id}
    <DatabaseDetails {database} />
  {/key}
</LayoutWithHeader>
