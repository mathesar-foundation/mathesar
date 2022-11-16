<script lang="ts">
  import { Icon, iconLoading } from '@mathesar/component-library';
  import { iconDeleteMajor, iconRecord } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type {
    ColumnsDataStore,
    RecordsData,
    TabularDataSelection,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import ActionItem from '../ActionItem.svelte';

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

  $: ({ savedRecords } = recordsData);
  $: ({ columns } = columnsDataStore);

  function getRecord(selectedRowIndex: number) {
    return $savedRecords[selectedRowIndex].record;
  }
</script>

<div class="actions-container">
  {#if selectedRowIndices.length === 1}
    <ActionItem
      href={$storeToGetRecordPageUrl({
        recordId: recordsData.getPkValueInRecord(
          getRecord(selectedRowIndices[0]),
          $columns,
        ),
      })}
    >
      <Icon {...iconRecord} />
      <span> Open Record </span>
    </ActionItem>
  {/if}
  <ActionItem danger on:click={handleDeleteRecords}>
    <Icon {...isDeleting ? iconLoading : iconDeleteMajor} />
    <span>
      Delete {selectedRowIndices.length} record{selectedRowIndices.length > 1
        ? 's'
        : ''}
    </span>
  </ActionItem>
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
