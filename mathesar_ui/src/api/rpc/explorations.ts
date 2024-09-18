import type { PaginatedResponse } from '@mathesar/api/rest/utils/requestUtils';
import type { Column, ColumnMetadata } from '@mathesar/api/rpc/columns';
import type { RawSchema } from '@mathesar/api/rpc/schemas';
import type { JoinPath } from '@mathesar/api/rpc/tables';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';
import type { FilterId } from '@mathesar/stores/abstract-types/types';

type QueryColumnAlias = string;

export interface QueryInstanceInitialColumn {
  alias: QueryColumnAlias;
  id: Column['id'];
  jp_path?: JoinPath;
}

type FilterConditionParams = [
  { column_name: [string] },
  ...{ literal: [unknown] }[],
];
type FilterCondition = Partial<Record<FilterId, FilterConditionParams>>;

export interface QueryInstanceFilterTransformation {
  type: 'filter';
  spec: FilterCondition;
}

export const querySummarizationFunctionIds = [
  'distinct_aggregate_to_array',
  'count',
  'sum',
  'median',
  'mode',
  'percentage_true',
  'max',
  'min',
  'mean',
  'peak_time',
  'peak_month',
] as const;

export type QuerySummarizationFunctionId =
  (typeof querySummarizationFunctionIds)[number];

export interface QueryInstanceSummarizationTransformation {
  type: 'summarize';
  spec: {
    base_grouping_column: string;
    grouping_expressions?: {
      input_alias: string;
      output_alias: string;
      preproc?: string;
    }[];
    aggregation_expressions?: {
      input_alias: string;
      output_alias: string;
      function: QuerySummarizationFunctionId;
    }[];
  };
}

export interface QueryInstanceHideTransformation {
  type: 'hide';
  spec: QueryColumnAlias[];
}

export interface QueryInstanceSortTransformation {
  type: 'order';
  spec: [
    {
      field: string;
      direction: 'asc' | 'desc';
    },
  ];
}

export type QueryInstanceTransformation =
  | QueryInstanceFilterTransformation
  | QueryInstanceSummarizationTransformation
  | QueryInstanceHideTransformation
  | QueryInstanceSortTransformation;

/** Called `ExplorationInfo` in Python docs */
export interface QueryInstance {
  readonly id: number;
  readonly database_id: number;
  readonly name: string;
  readonly description?: string;
  readonly base_table_oid: number;
  readonly initial_columns?: QueryInstanceInitialColumn[];
  readonly transformations?: QueryInstanceTransformation[];
  readonly display_names: Record<string, string> | null;
  readonly display_options?: unknown[];
}

export type UnsavedQueryInstance = Partial<QueryInstance>;

export interface QueryGetResponse extends QueryInstance {
  readonly schema: number;
}

/**
 * TODO: refactor this to match:
 *
 * ```ts
 * interface ExplorationDef {
 *   database_id: number;
 *   name: string;
 *   base_table_oid: number;
 *   initial_columns: unknown[];
 *   transformations?: unknown[];
 *   display_options?: unknown[];
 *   display_names?: Record<string, unknown>;
 *   description?: string;
 * }
 * ```
 */
export interface QueryRunRequest {
  base_table: QueryInstance['base_table_oid'];
  initial_columns: QueryInstanceInitialColumn[];
  transformations?: QueryInstanceTransformation[];
  display_names: QueryInstance['display_names'];
  parameters: {
    order_by?: {
      field: QueryColumnAlias;
      direction: 'asc' | 'desc';
    }[];
    limit: number;
    offset: number;
  };
}

export interface QueryResultColumn {
  alias: string;
  display_name: string | null;
  type: Column['type'];
  type_options: Column['type_options'];
  metadata: ColumnMetadata | null;
}

export interface QueryInitialColumnSource {
  is_initial_column: true;
  input_column_name: string;
  input_table_name: string;
  input_table_id: number;
}

export interface QueryGeneratedColumnSource {
  is_initial_column: false;
  input_alias: string;
}

interface QueryInitialColumnMetaData
  extends QueryResultColumn,
    QueryInitialColumnSource {}

interface QueryVirtualColumnMetaData
  extends QueryResultColumn,
    QueryGeneratedColumnSource {}

export type QueryColumnMetaData =
  | QueryInitialColumnMetaData
  | QueryVirtualColumnMetaData;

export type QueryResultRecord = Record<string, unknown>;

type QueryResultRecords =
  | PaginatedResponse<QueryResultRecord>
  | { count: 0; results: null };

/** Called `ExplorationResult` in Python docs */
export interface QueryRunResponse {
  records: QueryResultRecords;
  output_columns: QueryColumnAlias[];
  column_metadata: Record<string, QueryColumnMetaData>;
  query: {
    schema: RawSchema['oid'];
    base_table: QueryInstance['base_table_oid'];
    initial_columns: QueryInstanceInitialColumn[];
    transformations?: QueryInstanceTransformation[];
  };
  limit: unknown;
  offset: unknown;
  filter: unknown;
  order_by: unknown;
  /** Specifies a list of dicts containing column names and searched expression. */
  search: unknown;
  /** A list of column names for which you want duplicate records. */
  duplicate_only: unknown;
}

// =============================================================================

interface ExplorationDef {
  database_id: number;
  name: string;
  base_table_oid: number;
  initial_columns: unknown[];
  transformations?: unknown[];
  display_options?: unknown[];
  display_names?: Record<string, unknown>;
  description?: string;
}

export const explorations = {
  list: rpcMethodTypeContainer<{ database_id: number }, QueryInstance[]>(),

  get: rpcMethodTypeContainer<{ exploration_id: number }, QueryInstance>(),

  add: rpcMethodTypeContainer<ExplorationDef, void>(),

  delete: rpcMethodTypeContainer<{ exploration_id: number }, void>(),

  replace: rpcMethodTypeContainer<{ new_exploration: QueryInstance }, void>(),

  run: rpcMethodTypeContainer<
    { exploration_def: ExplorationDef },
    QueryRunResponse
  >(),

  run_saved: rpcMethodTypeContainer<
    {
      exploration_id: number;
      limit: number;
      offset: number;
    },
    QueryRunResponse
  >(),
};
