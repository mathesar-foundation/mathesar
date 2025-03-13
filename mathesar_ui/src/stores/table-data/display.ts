import { type Readable, type Writable, derived, writable } from 'svelte/store';

import type { RecordsData } from './records';
import {
  HelpTextRow,
  PlaceholderRecordRow,
  type Row,
  filterRecordRows,
} from './Row';

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

export class Display {
  private recordsData: RecordsData;

  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  displayableRecords: Readable<Row[]>;

  placeholderRowId: Readable<string>;

  constructor(recordsData: RecordsData) {
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);

    const placeholderRowId = writable('');
    this.placeholderRowId = placeholderRowId;

    const { savedRecordRowsWithGroupHeaders, newRecords } = this.recordsData;
    this.displayableRecords = derived(
      [savedRecordRowsWithGroupHeaders, newRecords],
      ([$savedRecordRowsWithGroupHeaders, $newRecords]) => {
        let allRecords: Row[] = $savedRecordRowsWithGroupHeaders;
        /**
         * Why are we calculating savedRecords here?
         * 1. We need it to properly calculate the row index of the
         *    placeholder row.
         * 2. Adding the savedRecords store as a dependency will
         *    execute this derived store's callback twice everytime
         *    records are fetched. So, it's calculated here instead.
         */
        const savedRecords = filterRecordRows(allRecords);
        if ($newRecords.length > 0) {
          allRecords = allRecords.concat(new HelpTextRow()).concat($newRecords);
        }
        const placeholderRow = new PlaceholderRecordRow({
          record: this.recordsData.getEmptyApiRecord(),
          rowIndex: savedRecords.length + $newRecords.length,
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

        allRecords = allRecords.concat(placeholderRow);
        return allRecords;
      },
    );
  }
}
