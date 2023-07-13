import { map } from 'iter-tools';

import { cartesianProduct } from '@mathesar/utils/iterUtils';
import type IdSequence from './IdSequence';
import { makeCellId } from '../cellIds';

function makeCells(
  rowIds: Iterable<string>,
  columnIds: Iterable<string>,
): Iterable<string> {
  return map(
    ([rowId, columnId]) => makeCellId(rowId, columnId),
    cartesianProduct(rowIds, columnIds),
  );
}

export default class Plane {
  readonly rowIds: IdSequence<string>;

  readonly columnIds: IdSequence<string>;

  readonly placeholderRowId: string | undefined;

  constructor(
    rowIds: IdSequence<string>,
    columnIds: IdSequence<string>,
    placeholderRowId: string | undefined,
  ) {
    this.rowIds = rowIds;
    this.columnIds = columnIds;
    this.placeholderRowId = placeholderRowId;
  }

  /**
   * @returns an iterable of all the data cells in the plane. This does not
   * include header cells or placeholder cells.
   */
  allDataCells(): Iterable<string> {
    return makeCells(this.rowIds, this.columnIds);
  }

  /**
   * @returns an iterable of all the data cells in the plane that are in or
   * between the two given rows. This does not include header cells.
   *
   * @throws Error if the id of the placeholder row is specified because the
   * placeholder row is not a data row.
   */
  dataCellsInRowRange(rowIdA: string, rowIdB: string): Iterable<string> {
    return makeCells(this.rowIds.range(rowIdA, rowIdB), this.columnIds);
  }

  /**
   * @returns an iterable of all the data cells in the plane that are in or
   * between the two given columns. This does not include header cells or
   * placeholder cells.
   */
  dataCellsInColumnRange(
    columnIdA: string,
    columnIdB: string,
  ): Iterable<string> {
    return makeCells(this.rowIds, this.columnIds.range(columnIdA, columnIdB));
  }

  get hasResultRows(): boolean {
    return this.rowIds.length > 0;
  }

  get hasPlaceholder(): boolean {
    return this.placeholderRowId !== undefined;
  }
}
