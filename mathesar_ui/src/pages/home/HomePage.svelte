<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { databasesStore } from '@mathesar/stores/databases';

  import DatabasesList from './DatabasesList.svelte';
  import Welcome from './Welcome.svelte';

  $: ({ databases } = databasesStore);
  $: console.log($databases);
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('databases'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': '0',
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  {#if $databases.size > 0}
    <DatabasesList />
  {:else}
    <Welcome />
  {/if}
</LayoutWithHeader>
