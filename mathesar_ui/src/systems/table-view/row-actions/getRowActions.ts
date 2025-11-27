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
import {
  extractPrimaryKeyValue,
  type TabularData,
} from '@mathesar/stores/table-data';
import { currentTablesMap } from '@mathesar/stores/tables';
import { toast } from '@mathesar/stores/toast';
import RecordStore from '@mathesar/systems/record-view/RecordStore';
import type { ModalController } from '@mathesar-component-library';
import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

export interface RowAction {
  type: 'quick-view' | 'open-record' | 'duplicate' | 'delete';
  icon: IconProps;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * A headless component that generates row action configurations based on
 * selected rows. This is used by both the context menu and the table inspector.
 *
 * The component is "headless" meaning it doesn't render DOM elements, but instead
 * yields action configuration objects that can be rendered as menu items or buttons.
 *
 * @param rowIds - Array of row identifiers to perform actions on
 * @param tabularData - The tabular data store
 * @param modalRecordView - Optional modal controller for quick view
 * @returns Generator that yields row action configurations
 */
export function* getRowActions(p: {
  rowIds: string[];
  tabularData: TabularData;
  modalRecordView?: ModalController<RecordStore>;
}): Generator<RowAction> {
  const { rowIds, tabularData, modalRecordView } = p;
  const isSingleRow = rowIds.length === 1;

  // Single row actions: Quick View and Open Record
  if (isSingleRow) {
    const rowId = rowIds[0];
    const canViewLinkedEntities = get(tabularData.canViewLinkedEntities);
    const columns = get(tabularData.columnsDataStore.columns);
    const selectableRowsMap = get(tabularData.recordsData.selectableRowsMap);
    
    const row = selectableRowsMap.get(rowId);
    let recordId: unknown;
    
    if (row) {
      try {
        recordId = extractPrimaryKeyValue(row.record, columns);
      } catch (e) {
        recordId = undefined;
      }
    }

    if (canViewLinkedEntities && recordId !== undefined) {
      // Quick View Record
      if (modalRecordView) {
        yield {
          type: 'quick-view',
          icon: iconModalRecordView,
          label: get(_)('quick_view_record'),
          onClick: () => {
            const containingTable = get(currentTablesMap).get(
              tabularData.table.oid,
            );
            if (!containingTable || recordId === undefined) return;
            const recordStore = new RecordStore({
              table: containingTable,
              recordPk: String(recordId),
            });
            modalRecordView.open(recordStore);
          },
        };
      }

      // Open Record (link to record page)
      const getRecordPageUrl = get(storeToGetRecordPageUrl);
      const recordPageUrl = getRecordPageUrl({
        tableId: tabularData.table.oid,
        recordId,
      });
      
      if (recordPageUrl) {
        yield {
          type: 'open-record',
          icon: iconLinkToRecordPage,
          label: get(_)('open_record'),
          href: recordPageUrl,
        };
      }
    }

    // Duplicate Record (only for single row)
    const canInsertRecords = get(tabularData.canInsertRecords);
    if (canInsertRecords && row) {
      yield {
        type: 'duplicate',
        icon: iconDuplicateRecord,
        label: get(_)('duplicate_record'),
        onClick: () => {
          void tabularData.recordsData.duplicateRecord(row);
        },
      };
    }
  }

  // Delete action (available for both single and multiple rows)
  const canDeleteRecords = get(tabularData.canDeleteRecords);
  if (canDeleteRecords) {
    yield {
      type: 'delete',
      icon: iconDeleteMajor,
      label: get(_)('delete_records', { values: { count: rowIds.length } }),
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
          onProceed: () => tabularData.recordsData.deleteSelected(rowIds),
          onError: (e) => toast.fromError(e),
        });
      },
    };
  }
}
