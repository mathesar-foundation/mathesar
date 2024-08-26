import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export type ResultValue = string | number | boolean | null;

export type SortDirection = 'asc' | 'desc';
export interface SortingEntry {
  /** column id */
  attnum: number;
  direction: SortDirection;
}

export interface SqlComparison {
  type:
    | 'and'
    | 'or'
    | 'equal'
    | 'lesser'
    | 'greater'
    | 'lesser_or_equal'
    | 'greater_or_equal'
    | 'contains_case_insensitive'
    | 'contains'
    | 'starts_with'
    | 'json_array_contains';
  args: [SqlExpr, SqlExpr];
}
export interface SqlFunction {
  type:
    | 'null'
    | 'not_null'
    | 'json_array_length'
    | 'uri_scheme'
    | 'uri_authority'
    | 'email_domain';
  args: [SqlExpr];
}
export interface SqlLiteral {
  type: 'literal';
  value: string | number | null;
}
export interface SqlColumn {
  type: 'attnum';
  value: number;
}
export type SqlExpr = SqlComparison | SqlFunction | SqlLiteral | SqlColumn;

export interface Group {
  /**
   * The total number of records in the group, even if the group extends beyond
   * the current page of records.
   */
  count: number;
  /**
   * Keys are stringified column attnums. Values are the values of those
   * columns _after_ the preproc functions have been applied.
   */
  results_eq: Record<string, ResultValue>;
  result_indices: number[];
}
export interface Grouping {
  /** Each value is a column attnum */
  columns: number[];
  preproc: (string | null)[];
}
export interface GroupingResponse extends Grouping {
  groups: Group[] | null;
}

export interface RecordsListParams {
  database_id: number;
  table_oid: number;
  limit?: number;
  offset?: number;
  order?: SortingEntry[];
  grouping?: Grouping;
  filter?: SqlExpr;
  search_fuzzy?: Record<string, unknown>[];
}

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
 * columns whitttch point to the same table. The front end does not need to parse
 * the column alias -- it just needs to match aliases within templates to
 * aliases within sets of input data.
 *
 * The keys in this type below are column aliases. The values are the data to be
 * rendered for that column.
 */
export type ApiRecordSummaryInputData = Record<string, ResultValue>;

export interface ApiDataForRecordSummariesInFkColumn {
  column: number;
  template: string;
  /**
   * Keys represent the record ids. Values represent the data necessary to
   * render the record summary for the record having that PK value. All key
   * values are string. If the PK values as stored in the database is a number,
   * then it will be stringified for transmission through the API.
   */
  data: Record<string, ApiRecordSummaryInputData>;
}

export interface RecordsResponse {
  count: number;
  grouping: GroupingResponse | null;
  results: Result[];
  /**
   * Each item in this array can be matched to each FK column in the table.
   */
  preview_data: ApiDataForRecordSummariesInFkColumn[] | null;
}

export const records = {
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      /** Keys are stringified attnums */
      record_def: Record<string, ResultValue>;
    },
    Pick<RecordsResponse, 'results' | 'preview_data'>
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      record_id: ResultValue;
      /** Keys are stringified attnums */
      record_def: Record<string, ResultValue>;
    },
    Pick<RecordsResponse, 'results' | 'preview_data'>
  >(),

  list: rpcMethodTypeContainer<RecordsListParams, RecordsResponse>(),

  delete: rpcMethodTypeContainer<
    { database_id: number; table_oid: number; record_ids: ResultValue[] },
    void
  >(),
};
