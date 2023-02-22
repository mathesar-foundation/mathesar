<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';
  import SoftwareUpdateContent from './SoftwareUpdateContent.svelte';

  const releaseDataStore = getReleaseDataStoreFromContext();
</script>

<svelte:head>
  <title>{makeSimplePageTitle('Software Update')}</title>
</svelte:head>

<h1>Software Update</h1>

{#if releaseDataStore}
  <SoftwareUpdateContent {releaseDataStore} />
{:else}
  <ErrorBox>Release data store not found in context.</ErrorBox>
{/if}
