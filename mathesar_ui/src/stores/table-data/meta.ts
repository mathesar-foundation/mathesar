import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import {
  ImmutableMap,
  ImmutableSet,
  WritableMap,
  WritableSet,
} from '@mathesar-component-library';
import type { RequestStatus } from '@mathesar/utils/api';
import Pagination from '@mathesar/utils/Pagination';
import type { TersePagination } from '@mathesar/utils/Pagination';
import type { TerseFiltering } from './filtering';
import { Filtering } from './filtering';
import type { TerseSorting } from './sorting';
import { Sorting } from './sorting';
import type { TerseGrouping } from './grouping';
import { Grouping } from './grouping';
import type { RecordsRequestParamsData } from './records';
import type { CellKey, RowKey } from './utils';
import { getRowStatus, getSheetState, extractRowKeyFromCellKey } from './utils';

/**
 * Unlike in `RequestStatus`, here the state and the error messages are
 * disentangled. That's because it's possible to have a `wholeRowState` of
 * `'success'` (if the row has been added) and still have error messages to
 * display (if the user has attempted to update a _cell_ within the row, but
 * that update has failed.)
 */
export interface RowStatus {
  /**
   * The combined state of the most recent "creation" or "deletion" request. We
   * use this to set the background color for all cells and the row header.
   */
  wholeRowState?: RequestStatus['state'];

  /**
   * The triangle error popover indicator will display whenever this array
   * contains errors -- even if `wholeRowState` is `'success'`.
   */
  errorsFromWholeRowAndCells: string[];
}

export interface MetaProps {
  pagination: Pagination;
  sorting: Sorting;
  grouping: Grouping;
  filtering: Filtering;
}

/** Adds default values. */
function getFullMetaProps(p?: Partial<MetaProps>): MetaProps {
  return {
    pagination: p?.pagination ?? new Pagination(),
    sorting: p?.sorting ?? new Sorting(),
    grouping: p?.grouping ?? new Grouping(),
    filtering: p?.filtering ?? new Filtering(),
  };
}

export type TerseMetaProps = [
  TersePagination,
  TerseSorting,
  TerseGrouping,
  TerseFiltering,
];

export function makeMetaProps(t: TerseMetaProps): MetaProps {
  return {
    pagination: Pagination.fromTerse(t[0]),
    sorting: Sorting.fromTerse(t[1]),
    grouping: Grouping.fromTerse(t[2]),
    filtering: Filtering.fromTerse(t[3]),
  };
}

export function makeTerseMetaProps(p?: Partial<MetaProps>): TerseMetaProps {
  const props = getFullMetaProps(p);
  return [
    props.pagination.terse(),
    props.sorting.terse(),
    props.grouping.terse(),
    props.filtering.terse(),
  ];
}

/**
 * The Meta store is meant to be used by other stores for storing and operating
 * on meta information. This may also include display properties. Properties in
 * Meta store do not depend on other stores. For display specific properties
 * that depend on other stores, the Display store can be used.
 */
export class Meta {
  pagination: Writable<Pagination>;

  sorting: Writable<Sorting>;

  grouping: Writable<Grouping>;

  filtering: Writable<Filtering>;

  selectedRows = new WritableSet<RowKey>();

  cellClientSideErrors = new WritableMap<CellKey, string[]>();

  rowsWithClientSideErrors: Readable<ImmutableSet<RowKey>>;

  /**
   * For each cell, the status of the most recent request to update the cell. If
   * no request has been made, then no entry will be present in the map.
   */
  cellModificationStatus = new WritableMap<CellKey, RequestStatus>();

  /**
   * For each row, the status of the most recent request to delete the row. If
   * no request has been made, then no entry will be present in the map.
   */
  rowDeletionStatus = new WritableMap<RowKey, RequestStatus>();

  /**
   * For each newly added row, the status of the most recent request to add
   * the row. If no request has been made, then no entry will be present in the
   * map. Rows that are not newly added rows will never have entries here.
   */
  rowCreationStatus = new WritableMap<RowKey, RequestStatus>();

  rowStatus: Readable<ImmutableMap<RowKey, RowStatus>>;

  sheetState: Readable<RequestStatus['state'] | undefined>;

  /**
   * Allows us to save and re-create Meta, e.g. from data stored in the tab
   * system.
   */
  props: Readable<MetaProps>;

  /**
   * Allows us to re-fetch records from the server when some of the parameters
   * change.
   */
  recordsRequestParamsData: Readable<RecordsRequestParamsData>;

  constructor(p?: Partial<MetaProps>) {
    const props = getFullMetaProps(p);
    this.pagination = writable(props.pagination);
    this.sorting = writable(props.sorting);
    this.grouping = writable(props.grouping);
    this.filtering = writable(props.filtering);

    this.rowsWithClientSideErrors = derived(
      this.cellClientSideErrors,
      (e) => new ImmutableSet([...e.keys()].map(extractRowKeyFromCellKey)),
    );

    this.rowStatus = derived(
      [
        this.cellClientSideErrors,
        this.cellModificationStatus,
        this.rowDeletionStatus,
        this.rowCreationStatus,
      ],
      ([
        cellClientSideErrors,
        cellModificationStatus,
        rowDeletionStatus,
        rowCreationStatus,
      ]) =>
        getRowStatus({
          cellClientSideErrors,
          cellModificationStatus,
          rowDeletionStatus,
          rowCreationStatus,
        }),
    );

    this.sheetState = derived(
      [
        this.cellModificationStatus,
        this.rowDeletionStatus,
        this.rowCreationStatus,
      ],
      ([cellModificationStatus, rowDeletionStatus, rowCreationStatus]) =>
        getSheetState({
          cellModificationStatus,
          rowDeletionStatus,
          rowCreationStatus,
        }),
    );

    // Why do `this.props` and `this.recordsRequestParamsData` look identical?
    //
    // It's a coincidence that `MetaProps` and `RecordsRequestParamsData` are
    // almost identical, but that might not always be the case. For example, if
    // we want to store info in the tabs system about the selected cells, then
    // `MetaProps` would need more fields. Using separate fields for
    // `this.props` and `this.recordsRequestParamsData` gives us a separation
    // of concerns.
    this.props = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
    this.recordsRequestParamsData = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
  }
}
