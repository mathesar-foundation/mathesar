<script lang="ts">
  import NotFoundPage from '@mathesar/components/NotFoundPage.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import RecordViewGatekeeper from '@mathesar/systems/record-view/RecordViewGatekeeper.svelte';
  import WithModalRecordView from '@mathesar/systems/record-view-modal/WithModalRecordView.svelte';

  import RecordPageContent from './RecordPageContent.svelte';

  export let record: RecordStore;

  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);

  function isFailureStatus(
    x: unknown,
  ): x is { state: 'failure'; errors: unknown } {
    return (
      typeof x === 'object' &&
      x !== null &&
      (x as { state?: unknown }).state === 'failure'
    );
  }

  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: recordStoreNotFound =
    isFailureStatus($recordStoreFetchRequest) &&
    Array.isArray(($recordStoreFetchRequest as { errors?: unknown }).errors) &&
    (
      (
        ($recordStoreFetchRequest as { errors?: unknown }).errors as unknown[]
      )[0] as { code?: unknown }
    ).code === 404;
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

{#if recordStoreNotFound}
  <LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
    <NotFoundPage message="Record Not Found" />
  </LayoutWithHeader>
{:else}
  <LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
    <RecordViewGatekeeper {record}>
      <WithModalRecordView>
        <RecordPageContent {record} />
      </WithModalRecordView>
    </RecordViewGatekeeper>
  </LayoutWithHeader>
{/if}
