export interface Grouping {
  /** Each string is a column id */
  columns: number[];
  mode: GroupingMode;
  /**
   * When `mode` === 'distinct', `num_groups` will always be `null`.
   *
   * When `mode` === 'percentile', `num_groups` will give the number of groups,
   * as specified in the request params.
   */
  num_groups: number | null;
  ranged: boolean;
  groups: Group[];
}

export type SortDirection = 'asc' | 'desc';
export interface SortingEntry {
  /** column id */
  field: number;
  direction: SortDirection;
}
export type FilterCombination = 'and' | 'or';
export type FilterOperation = 'eq' | 'ne' | 'get_duplicates';
export interface FilterCondition {
  /** column id */
  field: number;
  op: FilterOperation;
  value: unknown;
}
type MakeFilteringOption<U> = U extends string
  ? { [k in U]: FilterCondition[] }
  : never;
export type Filtering =
  | FilterCondition[]
  | MakeFilteringOption<FilterCombination>;

export interface GetRequestParams {
  limit?: number;
  offset?: number;
  order_by?: SortingEntry[];
  grouping?: Pick<Grouping, 'columns'>;
  filters?: Filtering;
}

export type ResultValue = string | number | boolean | null;

/** keys are stringified column ids */
export type Result = Record<string, ResultValue>;

export type GroupingMode = 'distinct' | 'percentile';

export interface Group {
  /**
   * The total number of records in the group, even if the group extends beyond
   * the current page of records.
   */
  count: number;
  first_value: ResultValue;
  /**
   * When GroupingMode is 'distinct', then `first_value` and `last_value` will
   * be identical. Separate first and last values are useful when GroupingMode
   * is 'percentile'. In that case, the first and last values refer to the
   * values in the order used for window function in the ranged grouping (which
   * may not be the same as the order used to sort the result set).
   */
  last_value: ResultValue;
  /**
   * Each number refers to the index of a record in the response result. This
   * array will only indices for records returned on the page. If the page is
   * too small to show all the records, some indices will be missing here.
   */
  result_indices: number[];
}

export interface Response {
  count: number;
  grouping: Grouping | null;
  results: Result[];
}
