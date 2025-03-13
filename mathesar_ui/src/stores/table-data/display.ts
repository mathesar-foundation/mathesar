import { type Readable, type Writable, derived, writable } from 'svelte/store';

import type { Result as ApiRecord } from '@mathesar/api/rpc/records';

import type { RecordsData } from './records';
import {
  GroupHeaderRow,
  HelpTextRow,
  PersistedRecordRow,
  PlaceholderRecordRow,
  type Row,
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

export function combineRecordRowsWithGroupHeaders({
  recordRows,
  grouping,
}: {
  recordRows: PersistedRecordRow[];
  grouping?: RecordGrouping;
}): (PersistedRecordRow | GroupHeaderRow)[] {
  const groupingColumnIds = grouping?.columnIds ?? [];
  const isResultGrouped = groupingColumnIds.length > 0;

  if (isResultGrouped && grouping) {
    const combinedRows: (PersistedRecordRow | GroupHeaderRow)[] = [];
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
      combinedRows.push(
        new GroupHeaderRow({
          group,
          groupValues,
        }),
      );
      group.resultIndices.forEach((resultIndex) => {
        const { record } = recordRows[resultIndex];
        combinedRows.push(
          new PersistedRecordRow({
            record,
            rowIndex: persistedRecordRowIndex,
          }),
        );
        persistedRecordRowIndex += 1;
      });
    });
    return combinedRows;
  }

  return recordRows;
}

export class Display {
  private recordsData: RecordsData;

  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  allRows: Readable<Row[]>;

  placeholderRowId: Readable<string>;

  constructor(recordsData: RecordsData) {
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);

    const placeholderRowId = writable('');
    this.placeholderRowId = placeholderRowId;

    const { fetchedRecordRows, newRecords, grouping } = this.recordsData;
    this.allRows = derived(
      [fetchedRecordRows, newRecords, grouping],
      ([$fetchedRecordRows, $newRecords, $grouping]) => {
        let rows: Row[] = combineRecordRowsWithGroupHeaders({
          recordRows: $fetchedRecordRows,
          grouping: $grouping,
        });
        if ($newRecords.length > 0) {
          rows = rows.concat(new HelpTextRow()).concat($newRecords);
        }
        const placeholderRow = new PlaceholderRecordRow({
          record: this.recordsData.getEmptyApiRecord(),
          rowIndex: $fetchedRecordRows.length + $newRecords.length,
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
        rows = rows.concat(placeholderRow);
        return rows;
      },
    );
  }
}
