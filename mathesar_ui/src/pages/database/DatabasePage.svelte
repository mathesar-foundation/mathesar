<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import PageLayoutWithSidebar from '@mathesar/layouts/PageLayoutWithSidebar.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import DatabaseNavigationList from './DatabaseNavigationList.svelte';
  import DatabaseDetails from './DatabaseDetails.svelte';

  export let database: Database;
</script>

<svelte:head><title>{makeSimplePageTitle(database.name)}</title></svelte:head>

<LayoutWithHeader
  restrictWidth={true}
  cssVariables={{
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--PageLayoutWithSidebar__gap': 'var(--size-ultra-large)',
    '--AppSecondaryHeader__padding': 'var(--size-x-large) 0',
  }}
>
  <PageLayoutWithSidebar>
    <DatabaseNavigationList {database} slot="sidebar" />
    {#key database.id}
      <DatabaseDetails {database} />
    {/key}
  </PageLayoutWithSidebar>
</LayoutWithHeader>
