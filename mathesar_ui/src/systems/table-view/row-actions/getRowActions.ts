import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  iconDeleteMajor,
  iconDuplicateRecord,
  iconLinkToRecordPage,
  iconModalRecordView,
} from '@mathesar/icons';
import { getRecordPageUrlByTable } from '@mathesar/routes/urls';
import { confirm } from '@mathesar/stores/confirmation';
import type { TabularData } from '@mathesar/stores/table-data';
import { currentTablesMap } from '@mathesar/stores/tables';
import { toast } from '@mathesar/stores/toast';
import RecordStore from '@mathesar/systems/record-view/RecordStore';
import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
import {
  type ButtonMenuEntry,
  type HyperlinkMenuEntry,
  type ModalController,
  buttonMenuEntry,
  hyperlinkMenuEntry,
} from '@mathesar-component-library';

export type RowAction = ButtonMenuEntry | HyperlinkMenuEntry;

export function getRowActions({
  rowIds,
  tabularData,
  modalRecordView,
  permissions = {
    canDeleteRecords: get(tabularData.canDeleteRecords),
    canInsertRecords: get(tabularData.canInsertRecords),
    canViewLinkedEntities: get(tabularData.canViewLinkedEntities),
  },
}: {
  rowIds: Iterable<string>;
  tabularData: TabularData;
  modalRecordView: ModalController<RecordStore> | undefined;
  permissions?: {
    canDeleteRecords: boolean;
    canInsertRecords: boolean;
    canViewLinkedEntities: boolean;
  };
}): RowAction[] {
  const selectedRowIds = [...rowIds];
  const soleRowId = takeFirstAndOnly(selectedRowIds);
  const recordId = soleRowId
    ? tabularData.getRecordIdFromRowId(soleRowId)
    : undefined;
  const actions: RowAction[] = [];

  if (recordId !== undefined && permissions.canViewLinkedEntities) {
    actions.push(
      buttonMenuEntry({
        label: get(_)('quick_view_record'),
        icon: iconModalRecordView,
        disabled: !modalRecordView,
        onClick: () => {
          if (!modalRecordView) return;
          const containingTable = get(currentTablesMap).get(
            tabularData.table.oid,
          );
          if (!containingTable) return;
          modalRecordView.open(
            new RecordStore({
              table: containingTable,
              recordPk: String(recordId),
            }),
          );
        },
      }),
    );

    const recordPageUrl = getRecordPageUrlByTable(tabularData.table, recordId);
    if (recordPageUrl) {
      actions.push(
        hyperlinkMenuEntry({
          icon: iconLinkToRecordPage,
          label: get(_)('open_record'),
          href: recordPageUrl,
        }),
      );
    }
  }

  if (soleRowId && permissions.canInsertRecords) {
    actions.push(
      buttonMenuEntry({
        icon: iconDuplicateRecord,
        label: get(_)('duplicate_record'),
        onClick: () => {
          const row = get(tabularData.recordsData.selectableRowsMap).get(
            soleRowId,
          );
          if (row) void tabularData.recordsData.duplicateRecord(row);
        },
      }),
    );
  }

  if (permissions.canDeleteRecords) {
    actions.push(
      buttonMenuEntry({
        icon: iconDeleteMajor,
        danger: true,
        label: get(_)('delete_records', {
          values: { count: selectedRowIds.length },
        }),
        onClick: () => {
          void confirm({
            title: get(_)('delete_records_question', {
              values: { count: selectedRowIds.length },
            }),
            body: [
              get(_)('deleted_records_cannot_be_recovered', {
                values: { count: selectedRowIds.length },
              }),
              get(_)('are_you_sure_to_proceed'),
            ],
            onProceed: () =>
              tabularData.recordsData.deleteSelected(selectedRowIds),
            onError: (e) => toast.fromError(e),
          });
        },
      }),
    );
  }

  return actions;
}
