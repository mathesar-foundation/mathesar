<script lang="ts">
  import {
    AnchorButton,
    Button,
    Icon,
    iconExternalLink,
  } from '@mathesar/component-library';
  import { iconDeleteMajor, iconRecord } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type {
    ColumnsDataStore,
    RecordsData,
    TabularDataSelection,
  } from '@mathesar/stores/table-data';
  import { getPkValueInRecord } from '@mathesar/stores/table-data/records';
  import { toast } from '@mathesar/stores/toast';
  import { labeledCount } from '@mathesar/utils/languageUtils';

  export let selectedRowIndices: number[];
  export let recordsData: RecordsData;
  export let selection: TabularDataSelection;
  export let columnsDataStore: ColumnsDataStore;
  export let canEditTableRecords: boolean;

  async function handleDeleteRecords() {
    void confirmDelete({
      identifierType: 'Row',
      onProceed: () => recordsData.deleteSelected(selectedRowIndices),
      onError: (e) => toast.fromError(e),
      onSuccess: () => {
        toast.success({
          title: 'Row deleted successfully!',
        });
        selection.resetSelection();
      },
    });
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

  $: showOpenRecordLink = selectedRowIndices.length === 1 && recordPageLink;
  $: showDeleteRecordButton = canEditTableRecords;
  $: showNullStateText = !showDeleteRecordButton && !showOpenRecordLink;
</script>

<div class="actions-container">
  {#if showOpenRecordLink}
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
  {#if showDeleteRecordButton}
    <Button appearance="outline-primary" on:click={handleDeleteRecords}>
      <Icon {...iconDeleteMajor} />
      <span>
        Delete {labeledCount(selectedRowIndices, 'records', {
          casing: 'title',
          countWhenSingular: 'hidden',
        })}
      </span>
    </Button>
  {/if}
  {#if showNullStateText}
    <span class="null-text">
      There are no actions to perform on the selected record.
    </span>
  {/if}
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

  .null-text {
    color: var(--color-text-muted);
  }
</style>
