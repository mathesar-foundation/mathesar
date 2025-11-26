<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';

  import {
    iconDeleteMajor,
    iconLinkToRecordPage,
    iconModalRecordView,
    iconDuplicateMajor,
  } from '@mathesar/icons';

  import { toast } from '@mathesar/stores/toast';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import RecordStore from '@mathesar/systems/record-view/RecordStore';
  import { currentTablesMap } from '@mathesar/stores/tables';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import {
    extractPrimaryKeyValue,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';

  // --- Props and Contexts ---
  export let selectedRowIds: Set<string>;
  export let recordsData;
  export let table;
  export let columns;
  export let canDeleteRecords: boolean;

  const modalRecordView = modalRecordViewContext.get();

  $: selectedRowCount = selectedRowIds.size;

  // --- Logic for Single Selection Actions ---
  // compute recordId only for single selection
  $: recordId = (() => {
    if (selectedRowCount !== 1) return undefined;

    const id = [...selectedRowIds][0];
    const row = recordsData.selectableRowsMap.get(id);
    if (!row) return undefined;

    try {
      return extractPrimaryKeyValue(row.record, columns);
    } catch (_) {
      return undefined;
    }
  })();

  $: recordPageLink = recordId
    ? storeToGetRecordPageUrl({
        tableId: table.oid,
        recordId,
      })
    : undefined;

  function quickViewRecord() {
    if (!modalRecordView || recordId === undefined) return;

    const containingTable = currentTablesMap.get(table.oid);
    if (!containingTable) return;

    const recordStore = new RecordStore({
      table: containingTable,
      recordPk: String(recordId),
    });

    modalRecordView.open(recordStore);
  }

  // --- Action Handlers ---

  async function handleDuplicateRecords() {
    const count = selectedRowCount;
    if (count === 0) return;

    try {
      await recordsData.duplicateSelected(selectedRowIds);
      toast.success({
        title: $_('count_records_duplicated_successfully', {
          values: { count },
        }),
      });
    } catch (e) {
      toast.fromError(e);
    }
  }

  async function handleDeleteRecords() {
    const count = selectedRowCount;
    if (count === 0) return;

    confirmDelete({
      identifierType: $_('multiple_records', { values: { count } }),
      body: [
        $_('deleted_records_cannot_be_recovered', { values: { count } }),
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
  {#if recordPageLink && selectedRowCount === 1}
    <Button on:click={quickViewRecord} appearance="action">
      <Icon {...iconModalRecordView} />
      <span>{$_('quick_view_record')}</span>
    </Button>

    <AnchorButton href={recordPageLink} appearance="action">
      <Icon {...iconLinkToRecordPage} />
      <span>{$_('open_record')}</span>
    </AnchorButton>
  {/if}

  <Button on:click={handleDuplicateRecords} appearance="action">
    <Icon {...iconDuplicateMajor} />
    <span>
      {$_('duplicate_records', { values: { count: selectedRowCount } })}
    </span>
  </Button>

  <Button
    on:click={handleDeleteRecords}
    disabled={!canDeleteRecords}
    appearance="danger"
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