export interface Grouping {
  /** Each string is a column id */
  columns: number[];
  mode: GroupingMode;
  /**
   * Preproc needs to contain id of a preproc function.
   * The number of preproc functions should match the
   * number of columns, or it should be null.
   */
  preproc: (string | null)[] | null;
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
export type FilterConditionParams = [
  { column_id: [number] },
  ...{ literal: [unknown] }[],
];
export type FilterCondition = Record<string, FilterConditionParams>;
type MakeFilteringOption<U> = U extends string
  ? { [k in U]: FilterRequest[] }
  : never;
export type FilterRequest =
  | FilterCondition
  | MakeFilteringOption<FilterCombination>;

export interface GetRequestParams {
  limit?: number;
  offset?: number;
  order_by?: SortingEntry[];
  grouping?: Pick<Grouping, 'columns' | 'preproc'>;
  filter?: FilterRequest;
  search_fuzzy?: Record<string, unknown>[];
}

export type ResultValue = string | number | boolean | null;

/** keys are stringified column ids */
export type Result = Record<string, ResultValue>;

/**
 * Provides the data necessary to render one Record Summary, given a summary
 * template. The template will contain column aliases enclosed in curly braces
 * as in the following example template which contains only one column alias.
 *
 * ```
 * {65__66__col__67}
 * ```
 *
 * The column alias, "65__66__col__67" is a unique serialization of the full
 * path traversed through foreign keys to find the column which contains the
 * value to be rendered within the template. Because record summaries can be
 * transitive, the value may lie within a column several tables away. The alias
 * needs to represent the full path so that we avoid collisions between two FK
 * columns which point to the same table. The front end does not need to parse
 * the column alias -- it just needs to match aliases within templates to
 * aliases within sets of input data.
 *
 * The keys in this type below are column aliases. The values are the data to be
 * rendered for that column.
 */
export type RecordSummaryInputData = Record<string, ResultValue>;

export type GroupingMode = 'distinct' | 'percentile';

export interface Group {
  /**
   * The total number of records in the group, even if the group extends beyond
   * the current page of records.
   */
  count: number;
  /**
   * eq_value will contain preprocessed value when grouping contains preproc
   * functions. In other cases, it will be identical to first_value.
   */
  eq_value: Result;
  first_value: Result;
  /**
   * When GroupingMode is 'distinct', then `first_value` and `last_value` will
   * be identical. Separate first and last values are useful when GroupingMode
   * is 'percentile'. In that case, the first and last values refer to the
   * values in the order used for window function in the ranged grouping (which
   * may not be the same as the order used to sort the result set).
   */
  last_value: Result;
  /**
   * Each number refers to the index of a record in the response result. This
   * array will only indices for records returned on the page. If the page is
   * too small to show all the records, some indices will be missing here.
   */
  result_indices: number[];
}

export interface DataForRecordSummariesInFkColumn {
  column: number;
  template: string;
  /**
   * Each item in this array provides the inputs for one cell within the column.
   * The array is to be matched, index for index, with the records in the
   * results.
   */
  data: RecordSummaryInputData[];
}

export interface Response {
  count: number;
  grouping: Grouping | null;
  results: Result[];
  /**
   * Each item in this array can be matched to each FK column in the table.
   */
  preview_data: DataForRecordSummariesInFkColumn[] | null;
}
