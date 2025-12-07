import { type Readable, type Writable, derived, writable } from 'svelte/store';

import type { Result as ApiRecord } from '@mathesar/api/rpc/records';
import type Pagination from '@mathesar/utils/Pagination';
import { assertExhaustive } from '@mathesar-component-library';

import type { Meta } from './meta';
import type { RecordsData } from './records';
import {
  type DraftRecordRow,
  GroupHeaderRow,
  HelpTextRow,
  type PersistedRecordRow,
  PlaceholderRecordRow,
} from './Row';
import type { RecordGrouping } from './utils';

export interface ColumnPlacement {
  /** CSS value in px */
  width: number;
  /** CSS value in px */
  left: number;
}

function cellStyle(placement: ColumnPlacement, leftOffset: number): string {
  return `width: ${placement.width}px; left: ${leftOffset + placement.left}px;`;
}

export function getCellStyle(
  placements: Map<string, ColumnPlacement>,
  columnId: string,
  leftOffset = 0,
): string {
  const placement = placements.get(columnId) ?? { width: 0, left: 0 };
  return cellStyle(placement, leftOffset);
}

export enum RowOrigin {
  FetchedFromDb = 'fetchedFromDb',
  NewlyCreatedViaUi = 'newlyCreatedViaUi',
  StaticUiElement = 'staticlyPresentInUi',
}

export interface DisplayRecordRowDescriptor {
  row: PersistedRecordRow | DraftRecordRow;
  rowNumber: number;
  rowOrigin: RowOrigin.FetchedFromDb | RowOrigin.NewlyCreatedViaUi;
}

export interface DisplayUiRowDescriptor {
  row: HelpTextRow | GroupHeaderRow | PlaceholderRecordRow;
  rowOrigin: RowOrigin.StaticUiElement;
}

export type DisplayRowDescriptor =
  | DisplayRecordRowDescriptor
  | DisplayUiRowDescriptor;

export function getRowNumber(rowDescriptor: DisplayRowDescriptor): number {
  if (rowDescriptor.rowOrigin === RowOrigin.FetchedFromDb) {
    return rowDescriptor.rowNumber;
  }
  if (rowDescriptor.rowOrigin === RowOrigin.NewlyCreatedViaUi) {
    return rowDescriptor.rowNumber;
  }
  if (rowDescriptor.rowOrigin === RowOrigin.StaticUiElement) {
    return 0;
  }
  return assertExhaustive(rowDescriptor.rowOrigin);
}

function combineRecordRowsWithGroupHeaders({
  recordRows,
  grouping,
  pagination,
}: {
  recordRows: PersistedRecordRow[];
  grouping?: RecordGrouping;
  pagination: Pagination;
}): DisplayRowDescriptor[] {
  const groupingColumnIds = grouping?.columnIds ?? [];
  const isResultGrouped = groupingColumnIds.length > 0;

  function makeRowNumber(index: number) {
    return index + pagination.offset + 1;
  }

  if (isResultGrouped && grouping) {
    const combinedRows: DisplayRowDescriptor[] = [];
    let persistedRecordRowIndex = 0;

    grouping.groups.forEach((group) => {
      const groupValues: ApiRecord = {};
      grouping.columnIds.forEach((columnId) => {
        const stringColumnId = String(columnId);
        if (group.eqValue[columnId] !== undefined) {
          groupValues[stringColumnId] = group.eqValue[columnId];
        } else {
          groupValues[stringColumnId] = group.eqValue[columnId];
        }
      });
      combinedRows.push({
        row: new GroupHeaderRow({
          group,
          groupValues,
        }),
        rowOrigin: RowOrigin.StaticUiElement,
      });
      group.resultIndices.forEach((resultIndex) => {
        const recordRow = recordRows[resultIndex];
        if (!recordRow) {
          // ⚠️ This is a weird case. It _does_ actually occur. Returning is a
          // bit of a hack. Fixing this properly will require some refactoring
          // of stores. See comments in:
          // https://github.com/mathesar-foundation/mathesar/issues/4594 and/or
          // the related PR
          return;
        }
        combinedRows.push({
          row: recordRow,
          rowOrigin: RowOrigin.FetchedFromDb,
          rowNumber: makeRowNumber(persistedRecordRowIndex),
        });
        persistedRecordRowIndex += 1;
      });
    });
    return combinedRows;
  }

  return recordRows.map((row, index) => ({
    row,
    rowOrigin: RowOrigin.FetchedFromDb,
    rowNumber: makeRowNumber(index),
  }));
}

export class Display {
  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  displayRowDescriptors: Readable<DisplayRowDescriptor[]>;

  placeholderRowId: Readable<string>;

  constructor({ meta, recordsData }: { meta: Meta; recordsData: RecordsData }) {
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);

    const placeholderRowId = writable('');
    this.placeholderRowId = placeholderRowId;

    this.displayRowDescriptors = derived(
      [
        recordsData.fetchedRecordRows,
        recordsData.newRecords,
        recordsData.totalCount,
        recordsData.grouping,
        meta.pagination,
      ],
      ([fetchedRecordRows, newRecords, totalCount, grouping, pagination]) => {
        let displayRowDescriptors: DisplayRowDescriptor[] =
          combineRecordRowsWithGroupHeaders({
            recordRows: fetchedRecordRows,
            grouping,
            pagination,
          });

        if (newRecords.length > 0) {
          displayRowDescriptors = displayRowDescriptors
            .concat({
              row: new HelpTextRow(),
              rowOrigin: RowOrigin.StaticUiElement,
            })
            .concat(
              newRecords.map((row, index) => ({
                row,
                rowNumber: pagination.offset + (totalCount ?? 0) + index + 1,
                rowOrigin: RowOrigin.NewlyCreatedViaUi,
              })),
            );
        }

        const placeholderRow = new PlaceholderRecordRow({
          record: recordsData.getEmptyApiRecord(),
        });

        // This is really hacky! We have a side effect (mutating state) within a
        // derived store, which I don't like. I put this here during a large
        // refactor of the cell selection code because the Plane needs to know
        // the id of the placeholder row since cell selection behaves
        // differently in the placeholder row. I think we have some major
        // refactoring to do across all the code that handles "rows" and
        // "records" and things like that. There is a ton of mess there and I
        // didn't want to lump any of that refactoring into an already-large
        // refactor.
        placeholderRowId.set(placeholderRow.identifier);

        displayRowDescriptors = displayRowDescriptors.concat({
          row: placeholderRow,
          rowOrigin: RowOrigin.StaticUiElement,
        });
        return displayRowDescriptors;
      },
    );
  }
}
