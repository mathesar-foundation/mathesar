import { concat } from 'iter-tools';
import {
  ImmutableMap,
  ImmutableSet,
  WritableMap,
} from '@mathesar-component-library';
import type { Column } from '@mathesar/api/tables/columns';
import type { RequestStatus } from '@mathesar/utils/api';
import { getMostImportantRequestStatusState } from '@mathesar/utils/api';
import type { RowStatus } from './meta';
import type { RecordRow } from './records';

export type CellKey = string;
export type RowKey = string;

export const ID_ROW_CONTROL_COLUMN = -1;
export const ID_ADD_NEW_COLUMN = -2;

const CELL_KEY_SEPARATOR = '::';

export function getCellKey(rowKey: RowKey, columnId: string | number): CellKey {
  return `${String(rowKey)}${CELL_KEY_SEPARATOR}${columnId}`;
}

export function extractRowKeyFromCellKey(cellKey: CellKey): RowKey {
  return cellKey
    .split(CELL_KEY_SEPARATOR)
    .slice(0, -1)
    .join(CELL_KEY_SEPARATOR);
}

export const ROW_HAS_CELL_ERROR_MSG = 'This row contains a cell with an error.';

export function getRowStatus({
  cellClientSideErrors,
  cellModificationStatus,
  rowCreationStatus,
  rowDeletionStatus,
}: {
  cellClientSideErrors: ImmutableMap<CellKey, string[]>;
  cellModificationStatus: ImmutableMap<CellKey, RequestStatus>;
  rowCreationStatus: ImmutableMap<RowKey, RequestStatus>;
  rowDeletionStatus: ImmutableMap<RowKey, RequestStatus>;
}): ImmutableMap<RowKey, RowStatus> {
  type PartialResult = ImmutableMap<RowKey, Partial<RowStatus>>;

  const keysOfRowsWithClientCellErrors = [...cellClientSideErrors.keys()].map(
    extractRowKeyFromCellKey,
  );

  const keysOfRowsWithCellModificationErrors = [
    ...cellModificationStatus,
  ].reduce(
    (rows, [cellKey, cellStatus]) =>
      cellStatus.state === 'failure'
        ? rows.with(extractRowKeyFromCellKey(cellKey))
        : rows,
    new ImmutableSet<RowKey>(),
  );

  const statusFromCells: PartialResult = new ImmutableMap(
    [
      ...keysOfRowsWithClientCellErrors,
      ...keysOfRowsWithCellModificationErrors,
    ].map((rowKey) => [
      rowKey,
      { errorsFromWholeRowAndCells: [ROW_HAS_CELL_ERROR_MSG] },
    ]),
  );

  const statusFromCreationAndDeletion = rowCreationStatus
    // status from deletion will supersede status from creation
    .withEntries(rowDeletionStatus)
    .mapValues((requestStatus) => ({
      wholeRowState: requestStatus.state,
      errorsFromWholeRowAndCells:
        requestStatus.state === 'failure' ? requestStatus.errors : [],
    }));

  function mergeRowStatuses(
    a: Partial<RowStatus>,
    b: Partial<RowStatus>,
  ): RowStatus {
    return {
      wholeRowState: a.wholeRowState ?? b.wholeRowState,
      errorsFromWholeRowAndCells: [
        ...(a.errorsFromWholeRowAndCells ?? []),
        ...(b.errorsFromWholeRowAndCells ?? []),
      ],
    };
  }

  function makeStatusComplete(partialStatus: Partial<RowStatus>): RowStatus {
    return {
      errorsFromWholeRowAndCells: [],
      ...partialStatus,
    };
  }

  return statusFromCells
    .withEntries(statusFromCreationAndDeletion, mergeRowStatuses)
    .mapValues(makeStatusComplete);
}

export function getSheetState(props: {
  cellModificationStatus: ImmutableMap<CellKey, RequestStatus>;
  rowCreationStatus: ImmutableMap<RowKey, RequestStatus>;
  rowDeletionStatus: ImmutableMap<RowKey, RequestStatus>;
}): RequestStatus['state'] | undefined {
  const allStatuses = concat(
    props.cellModificationStatus.values(),
    props.rowCreationStatus.values(),
    props.rowDeletionStatus.values(),
  );
  return getMostImportantRequestStatusState(allStatuses);
}

export function getClientSideCellErrors(
  cellValue: unknown,
  column: Column,
): string[] {
  const errors = [];
  if (cellValue === null && !column.nullable) {
    errors.push('Cell value cannot be NULL for this column.');
  }
  if (cellValue === undefined && !column.default) {
    errors.push('This column requires an initial value.');
  }
  return errors;
}

export function validateCell({
  cellValue,
  column,
  cellKey,
  cellClientSideErrors,
}: {
  cellValue: unknown;
  column: Column;
  cellKey: CellKey;
  cellClientSideErrors: WritableMap<CellKey, string[]>;
}): void {
  const errors = getClientSideCellErrors(cellValue, column);
  if (errors.length) {
    cellClientSideErrors.set(cellKey, errors);
  } else {
    cellClientSideErrors.delete(cellKey);
  }
}

export function validateRow({
  row,
  rowKey,
  columns,
  cellClientSideErrors,
}: {
  row: RecordRow;
  rowKey: RowKey;
  columns: Column[];
  cellClientSideErrors: WritableMap<CellKey, string[]>;
}): void {
  columns.forEach((column) => {
    validateCell({
      cellValue: row.record[String(column.id)],
      column,
      cellKey: getCellKey(rowKey, column.id),
      cellClientSideErrors,
    });
  });
}
