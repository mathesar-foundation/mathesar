import { writable, get, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { WritableMap } from '@mathesar-component-library';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';
import type { Row, RecordsData } from './records';

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number;
  columnIndex: number;
}

export const ROW_CONTROL_COLUMN_WIDTH = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;
export const DEFAULT_COLUMN_WIDTH = 160;

const movementKeys = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Tab',
]);

export function isCellActive(
  activeCell: ActiveCell,
  row: Row,
  column: Column,
): boolean {
  return (
    activeCell &&
    activeCell?.columnIndex === column.__columnIndex &&
    activeCell.rowIndex === row.rowIndex
  );
}

// TODO: Create a common utility action to handle active element based scroll
export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null =
    document.querySelector('.cell.is-active');
  const activeRow = activeCell?.parentElement;
  const container = document.querySelector('.virtual-list.outerElement');
  if (!container || !activeRow) {
    return;
  }
  // Vertical scroll
  if (
    activeRow.offsetTop + activeRow.clientHeight + 40 >
    container.scrollTop + container.clientHeight
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().bottom -
      activeRow.getBoundingClientRect().bottom -
      40;
    container.scrollTop -= offsetValue;
  } else if (activeRow.offsetTop - 30 < container.scrollTop) {
    container.scrollTop = activeRow.offsetTop - 30;
  }

  // Horizontal scroll
  if (
    activeCell.offsetLeft + activeRow.clientWidth + 30 >
    container.scrollLeft + container.clientWidth
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().right -
      activeCell.getBoundingClientRect().right -
      30;
    container.scrollLeft -= offsetValue;
  } else if (activeCell.offsetLeft - 30 < container.scrollLeft) {
    container.scrollLeft = activeCell.offsetLeft - 30;
  }
}

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

  activeCell: Writable<ActiveCell | undefined>;

  /**
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

  /** Keys are column ids. */
  columnPlacements: Readable<Map<number, ColumnPlacement>>;

  /** In px */
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
    this.activeCell = writable<ActiveCell | undefined>(undefined);

    this.customizedColumnWidths = new WritableMap();

    this.columnPlacements = derived(
      [this.columnsDataStore, this.customizedColumnWidths],
      ([columnsData, customizedColumnWidths]) => {
        let left = 0;
        const map = new Map<number, ColumnPlacement>();
        columnsData.columns.forEach(({ id }) => {
          const width = customizedColumnWidths.get(id) ?? DEFAULT_COLUMN_WIDTH;
          map.set(id, { width, left });
          left += width;
        });
        return map;
      },
    );

    this.rowWidth = derived(this.columnPlacements, (placements) => {
      const totalColumnWidth = [...placements.values()].reduce(
        (width, placement) => width + placement.width,
        0,
      );
      return totalColumnWidth + DEFAULT_ROW_RIGHT_PADDING;
    });

    const { savedRecords, newRecords } = this.recordsData;
    this.displayableRecords = derived(
      [savedRecords, newRecords],
      ([$savedRecords, $newRecords], set) => {
        let allRecords = $savedRecords;
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
          isAddPlaceholder: true,
        });
        set(allRecords);
      },
    );
  }

  resetActiveCell(): void {
    this.activeCell.set(undefined);
  }

  selectCell(row: Row, column: Column): void {
    this.activeCell.set({
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      rowIndex: row.rowIndex,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      columnIndex: column.__columnIndex,
    });
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent['key']): 'moved' | undefined {
    const { columns } = this.columnsDataStore.get();
    const totalCount = get(this.recordsData.totalCount);
    const savedRecords = get(this.recordsData.savedRecords);
    const newRecords = get(this.recordsData.newRecords);
    const pagination = get(this.meta.pagination);
    const { offset } = pagination;
    const pageSize = pagination.size;
    const minRowIndex = 0;
    const maxRowIndex =
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      Math.min(pageSize, totalCount - offset, savedRecords.length) +
      newRecords.length;
    const activeCell = get(this.activeCell);

    if (movementKeys.has(key) && activeCell) {
      this.activeCell.update((existing) => {
        if (!existing) {
          return undefined;
        }
        const newActiveCell = { ...existing };
        switch (key) {
          case 'ArrowDown':
            if (existing.rowIndex < maxRowIndex) {
              newActiveCell.rowIndex += 1;
            }
            break;
          case 'ArrowUp':
            if (existing.rowIndex > minRowIndex) {
              newActiveCell.rowIndex -= 1;
            }
            break;
          case 'ArrowRight':
          case 'Tab':
            if (existing.columnIndex < columns.length - 1) {
              newActiveCell.columnIndex += 1;
            }
            break;
          case 'ArrowLeft':
            if (existing.columnIndex > 0) {
              newActiveCell.columnIndex -= 1;
            }
            break;
          default:
            break;
        }
        return newActiveCell;
      });
      return 'moved';
    }

    return undefined;
  }
}
