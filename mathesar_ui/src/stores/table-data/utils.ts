import { concat } from 'iter-tools';

import {
  type RequestStatus,
  getMostImportantRequestStatusState,
} from '@mathesar/api/rest/utils/requestUtils';
import type { Column } from '@mathesar/api/rpc/columns';
import type {
  Group as ApiGroup,
  GroupingResponse as ApiGroupingResponse,
  Result as ApiRecord,
} from '@mathesar/api/rpc/records';
import {
  ImmutableMap,
  ImmutableSet,
  type WritableMap,
} from '@mathesar-component-library';

import type { RowStatus } from './meta';
import type { RecordRow, Row } from './Row';

export type CellKey = string;
export type RowKey = Row['identifier'];

export const ID_ROW_CONTROL_COLUMN = -1;
export const ID_ADD_NEW_COLUMN = -2;

const CELL_KEY_SEPARATOR = '::';

/**
 * ⚠️ Note: we have `cellId` and `cellKey` which are different.
 *
 * See notes in `records.ts.README.md`.
 */
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
  columns,
  cellClientSideErrors,
}: {
  row: RecordRow;
  columns: Column[];
  cellClientSideErrors: WritableMap<CellKey, string[]>;
}): void {
  columns.forEach((column) => {
    validateCell({
      cellValue: row.record[String(column.id)],
      column,
      cellKey: getCellKey(row.identifier, column.id),
      cellClientSideErrors,
    });
  });
}

/** See `records.ts.README.md` for more info */
export function getRowSelectionId(row: Row): string {
  return row.identifier;
}

export interface RecordGroup {
  count: number;
  eqValue: ApiGroup['results_eq'];
  resultIndices: number[];
}

export interface RecordGrouping {
  columnIds: number[];
  preprocIds: (string | null)[];
  groups: RecordGroup[];
}

function buildGroup(apiGroup: ApiGroup): RecordGroup {
  return {
    count: apiGroup.count,
    eqValue: apiGroup.results_eq,
    resultIndices: apiGroup.result_indices,
  };
}

export function buildGrouping(
  apiGrouping: ApiGroupingResponse,
): RecordGrouping {
  return {
    columnIds: apiGrouping.columns,
    preprocIds: apiGrouping.preproc ?? [],
    groups: (apiGrouping.groups ?? []).map(buildGroup),
  };
}

/**
 * Extracts the primary key value from a record.
 * @throws Error if no primary key column is found or the value is of an invalid type.
 * See `records.ts.README.md` for more info
 */
export function extractPrimaryKeyValue(
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
