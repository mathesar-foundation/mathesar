import type { PaginatedResponse } from '@mathesar/api/rest/utils/requestUtils';
import type { Column, ColumnMetadata } from '@mathesar/api/rpc/columns';
import type { JoinPath } from '@mathesar/api/rpc/tables';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';
import type { FilterId } from '@mathesar/stores/abstract-types/types';

export interface InitialColumn {
  alias: string;
  /** The PostgreSQL attnum of the column */
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
  /** Column aliases */
  spec: string[];
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

export interface SavedExploration {
  id: number;
  database_id: number;
  name: string;
  description?: string;
  base_table_oid: number;
  initial_columns: InitialColumn[];
  transformations?: QueryInstanceTransformation[];
  display_names?: Record<string, string> | null;
  display_options?: unknown[];
}

export type UnsavedExploration = Partial<SavedExploration> & {
  database_id: number;
};

export type AnonymousExploration = Omit<SavedExploration, 'id' | 'name'>;

export interface ExplorationRunParams {
  exploration_def: AnonymousExploration;
  limit: number;
  offset: number;
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

export interface ExplorationResult {
  records: QueryResultRecords;
  /** Each string is a column alias */
  output_columns: string[];
  column_metadata: Record<string, QueryColumnMetaData>;
  query: {
    /** The schema OID */
    schema: number;
    /** The table OID */
    base_table: number;
    initial_columns: InitialColumn[];
    transformations?: QueryInstanceTransformation[];
  };
  limit: number;
  offset: number;
  filter: unknown;
  order_by: unknown;
  /** Specifies a list of dicts containing column names and searched expression. */
  search: unknown;
  /** A list of column names for which you want duplicate records. */
  duplicate_only: unknown;
}

export const explorations = {
  list: rpcMethodTypeContainer<{ database_id: number }, SavedExploration[]>(),

  get: rpcMethodTypeContainer<{ exploration_id: number }, SavedExploration>(),

  add: rpcMethodTypeContainer<AnonymousExploration & { name: string }, void>(),

  delete: rpcMethodTypeContainer<{ exploration_id: number }, void>(),

  replace: rpcMethodTypeContainer<
    { new_exploration: SavedExploration },
    void
  >(),

  run: rpcMethodTypeContainer<ExplorationRunParams, ExplorationResult>(),

  run_saved: rpcMethodTypeContainer<
    {
      exploration_id: number;
      limit: number;
      offset: number;
    },
    ExplorationResult
  >(),
};
