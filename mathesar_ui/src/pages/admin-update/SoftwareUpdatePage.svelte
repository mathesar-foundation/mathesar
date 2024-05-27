<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';

  import SoftwareUpdateContent from './SoftwareUpdateContent.svelte';

  const releaseDataStore = getReleaseDataStoreFromContext();
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('software_update'))}</title>
</svelte:head>

<h1>{$_('software_update')}</h1>

{#if releaseDataStore}
  <SoftwareUpdateContent {releaseDataStore} />
{:else}
  <ErrorBox>{$_('release_data_store_not_found')}</ErrorBox>
{/if}
