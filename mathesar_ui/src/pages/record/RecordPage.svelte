<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import RecordViewGatekeeper from '@mathesar/systems/record-view/RecordViewGatekeeper.svelte';
  import WithModalRecordView from '@mathesar/systems/record-view-modal/WithModalRecordView.svelte';

  import ErrorBox from '../../components/message-boxes/ErrorBox.svelte';
  import ErrorPage from '../ErrorPage.svelte';

  import RecordPageContent from './RecordPageContent.svelte';

  export let record: RecordStore;

  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: recordStoreErrors =
    $recordStoreFetchRequest?.state === 'failure'
      ? $recordStoreFetchRequest?.errors
      : null;
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

{#if recordStoreErrors}
  <ErrorPage>
    <ErrorBox>
      {#each recordStoreErrors as error}
        <p>{error}</p>
      {/each}
    </ErrorBox>
  </ErrorPage>
{:else}
  <LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
    <RecordViewGatekeeper {record}>
      <WithModalRecordView>
        <RecordPageContent {record} />
      </WithModalRecordView>
    </RecordViewGatekeeper>
  </LayoutWithHeader>
{/if}
