<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import SoftwareUpdateContent from './SoftwareUpdateContent.svelte';

  const releaseDataStore = getReleaseDataStoreFromContext();
</script>

<svelte:head>
  <title>{makeSimplePageTitle($LL.general.softwareUpdate())}</title>
</svelte:head>

<h1>{$LL.general.softwareUpdate()}</h1>

{#if releaseDataStore}
  <SoftwareUpdateContent {releaseDataStore} />
{:else}
  <ErrorBox>{$LL.softwareUpdatePage.releaseDataNotInContextError()}</ErrorBox>
{/if}
