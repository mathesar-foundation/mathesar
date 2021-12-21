export type ResultValue = string | number | boolean | null;

export interface Result {
  [k: string]: ResultValue,
}

export type GroupingMode = 'distinct' | 'percentile';

export interface Group {
  /**
   * The total number of records in the group, even if the group extends beyond
   * the current page of records.
   */
  count: number,
  first_value: ResultValue,
  /**
   * When GroupingMode is 'distinct', then `first_value` and `last_value` will
   * be identical. Separate first and last values are useful when GroupingMode
   * is 'percentile'. In that case, the first and last values refer to the
   * values in the order used for window function in the ranged grouping (which
   * may not be the same as the order used to sort the result set).
   */
  last_value: ResultValue,
  /**
   * Each number refers to the index of a record in the response result. This
   * array will only indices for records returned on the page. If the page is
   * too small to show all the records, some indices will be missing here.
   */
  result_indices: number[],
}

export interface Grouping {
  /** Each string is a column name */
  columns: string[],
  mode: GroupingMode,
  /** TODO clarify purpose and behavior from back end team */
  num_groups: unknown,
  ranged: boolean,
  groups: Group[],
}

export interface Response {
  count: number,
  grouping: Grouping | null,
  results: Result[],
}
