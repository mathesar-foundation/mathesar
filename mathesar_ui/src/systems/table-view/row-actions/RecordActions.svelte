<script lang="ts" context="module">
  import type { IconProps } from '@mathesar-component-library/types';

  export interface RecordAction {
    type: 'button' | 'link';
    key: string;
    label: string;
    icon: IconProps;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    danger?: boolean;
  }
</script>

<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconDeleteMajor,
    iconDuplicateRecord,
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

  /**
   * Array of row identifiers for which to generate actions.
   * Can be a single row or multiple rows.
   */
  export let rowIds: Set<string>;

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  $: ({ table, recordsData, columnsDataStore, canDeleteRecords, canInsertRecords, canViewLinkedEntities } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ selectableRowsMap } = recordsData);
  $: isSingleRow = rowIds.size === 1;

  // Extract record ID for single row selection
  $: recordId = (() => {
    if (!isSingleRow) return undefined;
    const id = takeFirstAndOnly(rowIds);
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

  function duplicateRecord() {
    if (!isSingleRow) return;
    const rowId = takeFirstAndOnly(rowIds);
    if (!rowId) return;
    const row = $selectableRowsMap.get(rowId);
    if (!row) return;
    void recordsData.duplicateRecord(row);
  }

  function handleDeleteRecords() {
    const count = rowIds.size;
    void confirmDelete({
      identifierType: $_('multiple_records', { values: { count } }),
      body: [
        $_('deleted_records_cannot_be_recovered', { values: { count } }),
        $_('are_you_sure_to_proceed'),
      ],
      onProceed: () => recordsData.deleteSelected(rowIds),
      onError: (e) => toast.fromError(e),
      onSuccess: (c) => toast.success({
        title: $_('count_records_deleted_successfully', { values: { count: c } }),
      }),
    });
  }

  // Generate the list of actions based on current state
  $: actions = (() => {
    const result: RecordAction[] = [];

    // Single row actions
    if (isSingleRow && recordId !== undefined && $canViewLinkedEntities) {
      result.push({
        type: 'button',
        key: 'quick-view',
        label: $_('quick_view_record'),
        icon: iconModalRecordView,
        onClick: quickViewRecord,
      });

      if (recordPageLink) {
        result.push({
          type: 'link',
          key: 'open-record',
          label: $_('open_record'),
          icon: iconLinkToRecordPage,
          href: recordPageLink,
        });
      }
    }

    // Duplicate action (single row only)
    if (isSingleRow && $canInsertRecords) {
      result.push({
        type: 'button',
        key: 'duplicate',
        label: $_('duplicate_record'),
        icon: iconDuplicateRecord,
        onClick: duplicateRecord,
      });
    }

    // Delete action (single or multiple rows)
    result.push({
      type: 'button',
      key: 'delete',
      label: $_('delete_records', { values: { count: rowCount } }),
      icon: iconDeleteMajor,
      onClick: handleDeleteRecords,
    // Delete action (single or multiple rows)
    result.push({
      type: 'button',
      key: 'delete',
      label: $_('delete_records', { values: { count: rowIds.size } }),
      icon: iconDeleteMajor,
      onClick: handleDeleteRecords,
      disabled: !$canDeleteRecords,
      danger: true,
    });