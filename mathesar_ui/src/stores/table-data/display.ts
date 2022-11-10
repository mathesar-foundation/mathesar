import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { WritableMap } from '@mathesar-component-library';
import type { Meta } from './meta';
import type { ColumnsDataStore } from './columns';
import { type Row, type RecordsData, filterRecordRows } from './records';

// @deprecated
export const DEFAULT_COLUMN_WIDTH = 160;

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
  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  private recordsData: RecordsData;

  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  isTableInspectorVisible: Writable<boolean>;

  /**
   * @deprecated
   * Keys are column ids. Values are column widths in px.
   *
   * `customizedColumnWidths` is separate from `columnPlacements` to keep the
   * column resizing decoupled from the columns data until we determine how the
   * column widths will be persisted. At some point we will likely read/write
   * the column widths through the columns API, which will make both
   * `customizedColumnWidths` and `columnPlacements` irrelevant. Until then,
   * this decouple design keeps the column resizing logic isolated from other
   * code.
   */
  customizedColumnWidths: WritableMap<number, number>;

  /** @deprecated Keys are column ids. */
  columnPlacements: Readable<Map<number, ColumnPlacement>>;

  /** @deprecated In px */
  rowWidth: Readable<number>;

  displayableRecords: Readable<Row[]>;

  constructor(
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    recordsData: RecordsData,
  ) {
    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);
    this.isTableInspectorVisible = writable(true);

    this.customizedColumnWidths = new WritableMap();

    this.columnPlacements = derived(
      [this.columnsDataStore.columns, this.customizedColumnWidths],
      ([columns, customizedColumnWidths]) => {
        let left = 0;
        const map = new Map<number, ColumnPlacement>();
        columns.forEach(({ id }) => {
          const width = customizedColumnWidths.get(id) ?? DEFAULT_COLUMN_WIDTH;
          map.set(id, { width, left });
          left += width;
        });
        return map;
      },
    );

    this.rowWidth = derived(this.columnPlacements, (placements) =>
      [...placements.values()].reduce(
        (width, placement) => width + placement.width,
        0,
      ),
    );

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
          allRecords = allRecords
            .concat({
              identifier: '__new_help_text',
              isNewHelpText: true,
            })
            .concat($newRecords);
        }
        allRecords = allRecords.concat({
          ...this.recordsData.getNewEmptyRecord(),
          rowIndex: savedRecords.length + $newRecords.length,
          isAddPlaceholder: true,
        });
        return allRecords;
      },
    );
  }
}
