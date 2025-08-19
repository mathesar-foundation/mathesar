<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ResultValue } from '@mathesar/api/rpc/records';
  import {
    iconDeleteMajor,
    iconDuplicateRecord,
    iconLinkToRecordPage,
    iconModalRecordView,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type RecordRow,
    type RecordsData,
    getRowSelectionId,
    isRecordRow,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { ButtonMenuItem, LinkMenuItem } from '@mathesar-component-library';

  export let tableOid: number;
  export let row: RecordRow;
  export let recordPk: ResultValue | undefined = undefined;
  export let recordsData: RecordsData;
  export let canDeleteRecords: boolean;
  export let canInsertRecords: boolean;
  export let quickViewThisRecord: () => void;

  // To be used in case of publicly shared links where user should not be able
  // to view linked tables & explorations
  const canViewLinkedEntities = true;

  $: hasPk = recordPk !== undefined;
  $: recordPageUrl = $storeToGetRecordPageUrl({
    tableId: tableOid,
    recordId: recordPk,
  });

  async function handleDeleteRecords() {
    if (isRecordRow(row)) {
      void confirmDelete({
        identifierType: $_('record'),
        body: [
          $_('deleted_records_cannot_be_recovered', { values: { count: 1 } }),
          $_('are_you_sure_to_proceed'),
        ],
        onProceed: () => recordsData.deleteSelected(getRowSelectionId(row)),
        onError: (e) => toast.fromError(e),
        onSuccess: () =>
          toast.success({
            title: $_('record_deleted_successfully'),
          }),
      });
    }
  }

  function handleDuplicate() {
    void recordsData.duplicateRecord(row);
  }
</script>

{#if hasPk && canViewLinkedEntities}
  <ButtonMenuItem icon={iconModalRecordView} on:click={quickViewThisRecord}>
    {$_('quick_view_record')}
  </ButtonMenuItem>
  {#if recordPageUrl}
    <LinkMenuItem href={recordPageUrl} icon={iconLinkToRecordPage}>
      {$_('open_record')}
    </LinkMenuItem>
  {/if}
{/if}

<ButtonMenuItem
  on:click={handleDuplicate}
  icon={iconDuplicateRecord}
  disabled={!hasPk || !canInsertRecords}
>
  {$_('duplicate_record')}
</ButtonMenuItem>

<ButtonMenuItem
  on:click={handleDeleteRecords}
  icon={iconDeleteMajor}
  disabled={!canDeleteRecords}
>
  {$_('delete_records', { values: { count: 1 } })}
</ButtonMenuItem>
