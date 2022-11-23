<script lang="ts">
  import {
    AnchorButton,
    Button,
    Icon,
    iconExternalLink,
    iconLoading,
  } from '@mathesar/component-library';
  import { iconDeleteMajor, iconRecord } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type {
    ColumnsDataStore,
    RecordsData,
    TabularDataSelection,
  } from '@mathesar/stores/table-data';
  import {
    getPkValueInRecord,
    type RecordRow,
  } from '@mathesar/stores/table-data/records';
  import { toast } from '@mathesar/stores/toast';

  export let selectedRowIndices: number[];
  export let recordsData: RecordsData;
  export let selection: TabularDataSelection;
  export let columnsDataStore: ColumnsDataStore;

  let isDeleting = false;

  async function handleDeleteRecords() {
    if (!isDeleting) {
      try {
        isDeleting = true;
        selection.freezeSelection = true;
        await recordsData.deleteSelected(selectedRowIndices);
        selection.resetSelection();
      } catch (e) {
        toast.fromError(e);
      } finally {
        selection.freezeSelection = false;
        isDeleting = true;
      }
    }
  }

  $: ({ columns } = columnsDataStore);
  $: recordPageLink = (() => {
    const selectedRowIndex = selectedRowIndices[0];
    const recordRow = recordsData.getRecordRows()[selectedRowIndex];

    if (!recordRow) {
      return '';
    }

    let recordId: string | number;
    try {
      recordId = getPkValueInRecord(recordRow.record, $columns);
    } catch (e) {
      return '';
    }

    return (
      $storeToGetRecordPageUrl({
        recordId,
      }) || ''
    );
  })();
</script>

<div class="actions-container">
  {#if selectedRowIndices.length === 1 && recordPageLink}
    <AnchorButton href={recordPageLink}>
      <div class="action-item">
        <div>
          <Icon {...iconRecord} />
          <span> Open Record </span>
        </div>
        <Icon {...iconExternalLink} />
      </div>
    </AnchorButton>
  {/if}
  <Button appearance="outline-primary" on:click={handleDeleteRecords}>
    <Icon {...isDeleting ? iconLoading : iconDeleteMajor} />
    <span>
      Delete {selectedRowIndices.length} record{selectedRowIndices.length > 1
        ? 's'
        : ''}
    </span>
  </Button>
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
