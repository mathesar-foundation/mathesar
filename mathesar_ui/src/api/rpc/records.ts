import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RecordSummaryTemplate } from './tables';

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
  return_record_summaries?: boolean;
}

export interface RecordsSearchParams {
  database_id: number;
  table_oid: number;
  search_params: { attnum: number; literal: unknown }[];
  limit?: number;
  return_record_summaries?: boolean;
}

/** keys are stringified column ids */
export type Result = Record<string, ResultValue>;

/** Keys are stringified FK cell values. Values are record summaries. */
export type RecordSummaryColumnData = Record<string, string>;

export interface RecordsResponse {
  count: number;
  grouping: GroupingResponse | null;
  results: Result[];
  /** Keys are attnums. */
  linked_record_summaries: Record<string, RecordSummaryColumnData> | null;
  record_summaries: Record<string, string> | null;
}

export const records = {
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      /** Keys are stringified attnums */
      record_def: Record<string, unknown>;
      return_record_summaries?: boolean;
    },
    RecordsResponse
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      record_id: ResultValue;
      /** Keys are stringified attnums */
      record_def: Record<string, unknown>;
      return_record_summaries?: boolean;
    },
    RecordsResponse
  >(),

  get: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      record_id: ResultValue;
      return_record_summaries?: boolean;
      /**
       * Keys are stringified table OIDs. Values are record summary templates
       * that will override the templates stored in table metadata. These
       * overrides can be used to render a of a record summary using an
       * ephemeral template before any template is stored.
       * */
      table_record_summary_templates?: Record<
        string,
        RecordSummaryTemplate | null
      > | null;
    },
    RecordsResponse
  >(),

  list: rpcMethodTypeContainer<RecordsListParams, RecordsResponse>(),

  search: rpcMethodTypeContainer<RecordsSearchParams, RecordsResponse>(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      record_ids: ResultValue[];
    },
    void
  >(),
};
