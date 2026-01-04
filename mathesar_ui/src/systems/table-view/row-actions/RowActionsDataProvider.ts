import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  iconDeleteMajor,
  iconDuplicateRecord,
  iconLinkToRecordPage,
  iconModalRecordView,
} from '@mathesar/icons';
import { confirm } from '@mathesar/stores/confirmation';
import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
import type { TabularData } from '@mathesar/stores/table-data';
import { currentTablesMap } from '@mathesar/stores/tables';
import { toast } from '@mathesar/stores/toast';
import RecordStore from '@mathesar/systems/record-view/RecordStore';
import type { ModalController } from '@mathesar-component-library';
import type { IconProps } from '@mathesar-component-library/types';

export type RowIdentifier = string | number;

export interface RowAction {
  id: string;
  label: string;
  onClick: () => void;
  icon?: IconProps;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface RowActionsData {
  actions: RowAction[];
}

export function getRowActionsData(params: {
  rowIds: RowIdentifier[];
  tabularData: TabularData;
  modalRecordView?: ModalController<RecordStore>;
}): RowActionsData {
  const { rowIds, tabularData, modalRecordView } = params;
  const actions: RowAction[] = [];

  const canInsertRecords = get(tabularData.canInsertRecords);
  const canDeleteRecords = get(tabularData.canDeleteRecords);
  const canViewLinkedEntities = get(tabularData.canViewLinkedEntities);

  const rows = get(tabularData.recordsData.selectableRowsMap);

  const firstRowId = rowIds[0];
  const firstRow = firstRowId !== undefined ? rows.get(String(firstRowId)) : undefined;

  let recordId: string | number | undefined;
  if (firstRow) {
    try {
      const result = tabularData.getRecordIdFromRowId(String(firstRowId));
      recordId = (typeof result === 'string' || typeof result === 'number') ? result : undefined;
    } catch {
      recordId = undefined;
    }
  }

  if (
    canViewLinkedEntities &&
    rowIds.length === 1 &&
    recordId !== undefined &&
    modalRecordView
  ) {
    actions.push({
      id: 'quick-view-record',
      label: get(_)('quick_view_record'),
      icon: iconModalRecordView,
      onClick: () => {
        const containingTable = get(currentTablesMap).get(tabularData.table.oid);
        if (!containingTable) return;

        const recordStore = new RecordStore({
          table: containingTable,
          recordPk: String(recordId),
        });

        modalRecordView.open(recordStore);
      },
    });
  }

  if (canViewLinkedEntities && rowIds.length === 1 && recordId !== undefined) {
    const getRecordPageUrl = get(storeToGetRecordPageUrl);
    const recordPageUrl = getRecordPageUrl({
      tableId: tabularData.table.oid,
      recordId,
    });

    if (recordPageUrl) {
      actions.push({
        id: 'open-record',
        label: get(_)('open_record'),
        icon: iconLinkToRecordPage,
        href: recordPageUrl,
        onClick: () => { },
      });
    }
  }

  if (canInsertRecords && rowIds.length === 1 && firstRow) {
    actions.push({
      id: 'duplicate-record',
      label: get(_)('duplicate_record'),
      icon: iconDuplicateRecord,
      onClick: () => {
        void tabularData.recordsData.duplicateRecord(firstRow);
      },
    });
  }

  if (canDeleteRecords && rowIds.length > 0) {
    actions.push({
      id: 'delete-records',
      label: get(_)('delete_records', {
        values: { count: rowIds.length },
      }),
      icon: iconDeleteMajor,
      danger: true,
      onClick: () => {
        void confirm({
          title: get(_)('delete_records_question', {
            values: { count: rowIds.length },
          }),
          body: [
            get(_)('deleted_records_cannot_be_recovered', {
              values: { count: rowIds.length },
            }),
            get(_)('are_you_sure_to_proceed'),
          ],
          onProceed: () => tabularData.recordsData.deleteSelected(rowIds.map(String)),
          onError: (e) => toast.fromError(e),
          onSuccess: (count) => {
            toast.success({
              title: get(_)('count_records_deleted_successfully', {
                values: { count },
              }),
            });
          },
        });
      },
    });
  }

  return { actions };
}
