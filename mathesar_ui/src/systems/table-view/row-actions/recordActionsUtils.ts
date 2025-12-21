import type { TabularData } from '@mathesar/stores/table-data';
import type RecordStore from '@mathesar/systems/record-view/RecordStore';
import { takeFirstAndOnly } from '@mathesar/utils/iterUtils';
import type { ModalController } from '@mathesar-component-library';

import { deleteRecords } from '../context-menu/entries/deleteRecords';
import { duplicateRecord } from '../context-menu/entries/duplicateRecord';
import { viewRowRecord } from '../context-menu/entries/viewRowRecord';

/**
 * Generates menu entries for record actions based on the selected rows.
 * This is used by the context menu to provide a consistent set of actions.
 */
export function* getRecordActionMenuEntries({
  rowIds,
  tabularData,
  modalRecordView,
}: {
  rowIds: string[];
  tabularData: TabularData;
  modalRecordView: ModalController<RecordStore> | undefined;
}) {
  const soleRowId = takeFirstAndOnly(rowIds);

  if (soleRowId) {
    // Single row actions
    const recordId = tabularData.getRecordIdFromRowId(soleRowId);
    yield* viewRowRecord({ tabularData, recordId, modalRecordView });
    yield* duplicateRecord({ tabularData, rowId: soleRowId });
  }

  // Delete action (works for single or multiple rows)
  yield* deleteRecords({ tabularData, rowIds });
}
