<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconDeleteMajor,
    iconLinkToRecordPage,
    iconModalRecordView,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    extractPrimaryKeyValue,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { currentTablesMap } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import RecordStore from '@mathesar/systems/record-view/RecordStore';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  $: ({ table, selection, recordsData, columnsDataStore, canDeleteRecords } =
    $tabularData);
  $: selectedRowIds = $selection.rowIds;
  $: selectedRowCount = selectedRowIds.size;
  $: ({ columns } = columnsDataStore);
  $: ({ selectableRowsMap } = recordsData);
  $: recordId = (() => {
    const id = takeFirstAndOnly(selectedRowIds);
    if (!id) return undefined;
    const row = $selectableRowsMap.get(id);
    if (!row) return undefined;
    try {
      return extractPrimaryKeyValue(row.record, $columns);
    } catch (e) {
      return undefined;
    }
  })();
  $: recordPageLink = $storeToGetRecordPageUrl({
    tableId: table.oid,
    recordId,
  });

  function quickViewRecord() {
    if (!modalRecordView) return;
    if (recordId === undefined) return;
    const containingTable = $currentTablesMap.get(table.oid);
    if (!containingTable) return;
    const recordStore = new RecordStore({
      table: containingTable,
      recordPk: String(recordId),
    });
    modalRecordView.open(recordStore);
  }

  async function handleDeleteRecords() {
    void confirmDelete({
      identifierType: $_('multiple_records', {
        values: { count: selectedRowCount },
      }),
      body: [
        $_('deleted_records_cannot_be_recovered', {
          values: { count: selectedRowCount },
        }),
        $_('are_you_sure_to_proceed'),
      ],
      onProceed: () => recordsData.deleteSelected(selectedRowIds),
      onError: (e) => toast.fromError(e),
      onSuccess: (count) => {
        toast.success({
          title: $_('count_records_deleted_successfully', {
            values: { count },
          }),
        });
      },
    });
  }
</script>

<div class="actions-container">
  {#if recordPageLink}
    <Button on:click={quickViewRecord} appearance="action">
      <Icon {...iconModalRecordView} />
      <span>{$_('quick_view_record')}</span>
    </Button>

    <AnchorButton href={recordPageLink} appearance="action">
      <Icon {...iconLinkToRecordPage} />
      <span>{$_('open_record')}</span>
    </AnchorButton>
  {/if}

  <Button
    on:click={handleDeleteRecords}
    disabled={!$canDeleteRecords}
    appearance="action"
  >
    <Icon {...iconDeleteMajor} />
    <span>
      {$_('delete_records', { values: { count: selectedRowCount } })}
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
</style>
