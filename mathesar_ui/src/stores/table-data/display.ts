import { writable, get, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { WritableMap } from '@mathesar-component-library';
import type { Column } from '@mathesar/api/tables/columns';
import type { Meta } from './meta';
import type { ColumnsDataStore } from './columns';
import type { Row, RecordsData, RecordRow } from './records';

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number;
  columnId: number;
}

// @deprecated
export const DEFAULT_COLUMN_WIDTH = 160;

enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

function getDirection(event: KeyboardEvent): Direction | undefined {
  const { key } = event;
  const shift = event.shiftKey;
  switch (true) {
    case shift && key === 'Tab':
      return Direction.Left;
    case shift:
      return undefined;
    case key === 'ArrowUp':
      return Direction.Up;
    case key === 'ArrowDown':
      return Direction.Down;
    case key === 'ArrowLeft':
      return Direction.Left;
    case key === 'ArrowRight':
    case key === 'Tab':
      return Direction.Right;
    default:
      return undefined;
  }
}

function getHorizontalDelta(direction: Direction): number {
  switch (direction) {
    case Direction.Left:
      return -1;
    case Direction.Right:
      return 1;
    default:
      return 0;
  }
}

function getVerticalDelta(direction: Direction): number {
  switch (direction) {
    case Direction.Up:
      return -1;
    case Direction.Down:
      return 1;
    default:
      return 0;
  }
}

export function isCellActive(
  activeCell: ActiveCell,
  row: RecordRow,
  column: Column,
): boolean {
  return (
    activeCell &&
    activeCell?.columnId === column.id &&
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
    this.activeCell = writable<ActiveCell | undefined>(undefined);
    this.isTableInspectorVisible = writable(true);

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

    this.rowWidth = derived(this.columnPlacements, (placements) =>
      [...placements.values()].reduce(
        (width, placement) => width + placement.width,
        0,
      ),
    );

    const { savedRecords, newRecords } = this.recordsData;
    this.displayableRecords = derived(
      [savedRecords, newRecords],
      ([$savedRecords, $newRecords], set) => {
        let allRecords: Row[] = $savedRecords;
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

  selectCell(row: RecordRow, column: Column): void {
    this.activeCell.set({
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      rowIndex: row.rowIndex,
      columnId: column.id,
    });
  }

  private getAdjacentCell(
    activeCell: ActiveCell,
    direction: Direction,
  ): ActiveCell | undefined {
    const rowIndex = (() => {
      const delta = getVerticalDelta(direction);
      if (delta === 0) {
        return activeCell.rowIndex;
      }
      const totalCount = get(this.recordsData.totalCount) ?? 0;
      const savedRecords = get(this.recordsData.savedRecords);
      const newRecords = get(this.recordsData.newRecords);
      const pagination = get(this.meta.pagination);
      const { offset } = pagination;
      const pageSize = pagination.size;
      const minRowIndex = 0;
      const maxRowIndex =
        Math.min(pageSize, totalCount - offset, savedRecords.length) +
        newRecords.length;
      const newRowIndex = activeCell.rowIndex + delta;
      if (newRowIndex < minRowIndex || newRowIndex > maxRowIndex) {
        return undefined;
      }
      return newRowIndex;
    })();
    if (rowIndex === undefined) {
      return undefined;
    }

    const columnId = (() => {
      const delta = getHorizontalDelta(direction);
      if (delta === 0) {
        return activeCell.columnId;
      }
      const { columns } = this.columnsDataStore.get();
      const index = columns.findIndex((c) => c.id === activeCell.columnId);
      const target = columns[index + delta] as Column | undefined;
      return target?.id;
    })();
    if (columnId === undefined) {
      return undefined;
    }

    return { rowIndex, columnId };
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent): 'moved' | undefined {
    const direction = getDirection(key);
    if (!direction) {
      return undefined;
    }
    let moved = false;
    this.activeCell.update((activeCell) => {
      if (!activeCell) {
        return undefined;
      }
      const adjacentCell = this.getAdjacentCell(activeCell, direction);
      if (adjacentCell) {
        moved = true;
        return adjacentCell;
      }
      return activeCell;
    });

    return moved ? 'moved' : undefined;
  }
}
