<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type RecordStore from '@mathesar/stores/RecordStore';
  import RecordViewGatekeeper from '@mathesar/systems/record-view/RecordViewGatekeeper.svelte';

  import RecordPageContent from './RecordPageContent.svelte';

  export let record: RecordStore;

  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

<LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
  <RecordViewGatekeeper {record}>
    <RecordPageContent {record} />
  </RecordViewGatekeeper>
</LayoutWithHeader>
