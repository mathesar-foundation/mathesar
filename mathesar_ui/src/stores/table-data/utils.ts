import { concat } from 'iter-tools';
import { ImmutableMap, ImmutableSet } from '@mathesar-component-library';
import type { RequestStatus } from '@mathesar/utils/api';
import { getMostImportantRequestStatusState } from '@mathesar/utils/api';
import type { RowStatus } from './meta';

export type CellKey = string;
export type RowKey = string;

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
  cellModificationStatus,
  rowCreationStatus,
  rowDeletionStatus,
}: {
  cellModificationStatus: ImmutableMap<CellKey, RequestStatus>;
  rowCreationStatus: ImmutableMap<RowKey, RequestStatus>;
  rowDeletionStatus: ImmutableMap<RowKey, RequestStatus>;
}): ImmutableMap<RowKey, RowStatus> {
  type PartialResult = ImmutableMap<RowKey, Partial<RowStatus>>;

  const keysOfRowsWithCellErrors = [...cellModificationStatus].reduce(
    (rows, [cellKey, cellStatus]) =>
      cellStatus.state === 'failure'
        ? rows.with(extractRowKeyFromCellKey(cellKey))
        : rows,
    new ImmutableSet<RowKey>(),
  );

  const statusFromCells: PartialResult = new ImmutableMap(
    [...keysOfRowsWithCellErrors].map((rowKey) => [
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
