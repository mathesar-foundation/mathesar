import { type Readable, type Writable, derived, writable } from 'svelte/store';

import type { Result as ApiRecord } from '@mathesar/api/rpc/records';

import type { RecordsData } from './records';
import {
  type DraftRecordRow,
  GroupHeaderRow,
  HelpTextRow,
  PersistedRecordRow,
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
  placements: Map<number, ColumnPlacement>,
  columnId: number,
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

export function combineRecordRowsWithGroupHeaders({
  recordRows,
  grouping,
}: {
  recordRows: PersistedRecordRow[];
  grouping?: RecordGrouping;
}): DisplayRowDescriptor[] {
  const groupingColumnIds = grouping?.columnIds ?? [];
  const isResultGrouped = groupingColumnIds.length > 0;

  if (isResultGrouped && grouping) {
    const combinedRows: DisplayRowDescriptor[] = [];
    let persistedRecordRowIndex = 0;

    grouping.groups.forEach((group) => {
      const groupValues: ApiRecord = {};
      grouping.columnIds.forEach((columnId) => {
        if (group.eqValue[columnId] !== undefined) {
          groupValues[columnId] = group.eqValue[columnId];
        } else {
          groupValues[columnId] = group.eqValue[columnId];
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
        const { record } = recordRows[resultIndex];
        combinedRows.push({
          row: new PersistedRecordRow({
            record,
          }),
          rowOrigin: RowOrigin.FetchedFromDb,
          rowNumber: persistedRecordRowIndex,
        });
        persistedRecordRowIndex += 1;
      });
    });
    return combinedRows;
  }

  return recordRows.map((row, index) => ({
    row,
    rowOrigin: RowOrigin.FetchedFromDb,
    rowNumber: index,
  }));
}

export class Display {
  private recordsData: RecordsData;

  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  displayRowDescriptors: Readable<DisplayRowDescriptor[]>;

  placeholderRowId: Readable<string>;

  constructor(recordsData: RecordsData) {
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);

    const placeholderRowId = writable('');
    this.placeholderRowId = placeholderRowId;

    const { fetchedRecordRows, newRecords, grouping } = this.recordsData;
    this.displayRowDescriptors = derived(
      [fetchedRecordRows, newRecords, grouping],
      ([$fetchedRecordRows, $newRecords, $grouping]) => {
        let displayRowDescriptors: DisplayRowDescriptor[] =
          combineRecordRowsWithGroupHeaders({
            recordRows: $fetchedRecordRows,
            grouping: $grouping,
          });
        if ($newRecords.length > 0) {
          displayRowDescriptors = displayRowDescriptors
            .concat({
              row: new HelpTextRow(),
              rowOrigin: RowOrigin.StaticUiElement,
            })
            .concat(
              $newRecords.map((row, index) => ({
                row,
                rowNumber: index,
                rowOrigin: RowOrigin.NewlyCreatedViaUi,
              })),
            );
        }
        const placeholderRow = new PlaceholderRecordRow({
          record: this.recordsData.getEmptyApiRecord(),
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
