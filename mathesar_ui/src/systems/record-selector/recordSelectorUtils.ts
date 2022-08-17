import type { Column } from '@mathesar/api/tables/columns';
import type { Result as ApiRecord } from '@mathesar/api/tables/records';
import type {
  RecordSelectorSelection,
  SelectionDetails,
} from './recordSelectorTypes';

export function getPkValueInRecord(
  record: ApiRecord,
  columns: Column[],
): string | number {
  const pkColumn = columns.find((c) => c.primary_key);
  if (!pkColumn) {
    throw new Error('No primary key column found.');
  }
  const pkValue = record[pkColumn.id];
  if (!(typeof pkValue === 'string' || typeof pkValue === 'number')) {
    throw new Error('Primary key value is not a string or number.');
  }
  return pkValue;
}

function getOffsetSelection(
  selection: RecordSelectorSelection,
  offset: number,
): RecordSelectorSelection {
  const { type } = selection;
  if (selection.type === 'ghost') {
    return offset > 0 ? { type: 'record', index: offset - 1 } : selection;
  }
  const effectiveIndex = (type === 'record' ? selection.index : -1) + offset;
  return effectiveIndex < 0
    ? { type: 'ghost' }
    : { type: 'record', index: effectiveIndex };
}

/**
 * After variables within the results change, the user's selection might no
 * longer be valid. This function finds the nearest valid selection so that we
 * can update the selection with the result of this function when things change.
 */
export function findNearestValidSelection(
  d: SelectionDetails,
): RecordSelectorSelection {
  if (d.selection.type === 'ghost') {
    // Sometimes we end up in the ghost row purely by virtue of it being the
    // only row, even if the user didn't select it. In this case we want to move
    // back out of the ghost row if some results appear later.
    const needToMoveOutOfGhostRow =
      !d.hasGhostRow ||
      (!d.userHasManuallySelectedGhostRow && d.resultCount > 0);
    if (needToMoveOutOfGhostRow) {
      // Note that if `resultCount` is 0 (table is empty) the selection will
      // technically be invalid, but that's okay.
      return { type: 'record', index: 0 };
    }
    // We have a valid ghost row selection that we should keep.
    return d.selection;
  }

  // We have a record selection...

  if (d.hasGhostRow && (d.resultCount === 0 || d.selection.index < 0)) {
    // We should move to the ghost row.
    return { type: 'ghost' };
  }
  // We should stay in the record selection.

  if (d.selection.index >= d.resultCount) {
    // We've overflowed off the bottom and need to move to the last row.
    return { type: 'record', index: d.resultCount - 1 };
  }
  if (d.selection.index < 0) {
    // We've underflowed and need to move to the first row.
    return { type: 'record', index: 0 };
  }

  // We have a valid record selection.
  return d.selection;
}

/**
 * Moves the selection, the re-adjusts it as necessary to remain valid.
 */
export function getValidOffsetSelection(
  d: SelectionDetails,
  offset: number,
): RecordSelectorSelection {
  return findNearestValidSelection({
    ...d,
    selection: getOffsetSelection(d.selection, offset),
  });
}
