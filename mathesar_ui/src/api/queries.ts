import type { PaginatedResponse } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';
import type { JpPath } from '@mathesar/api/tables/joinable_tables';
import type { SchemaEntry } from '@mathesar/AppTypes';

export type QueryColumnAlias = string;

/**
 * endpoint: /api/db/v0/queries/<query_id>/
 */

export interface QueryInstanceInitialColumn {
  alias: QueryColumnAlias;
  id: Column['id'];
  jp_path?: JpPath;
  display_name: string;
}

// TODO: Extend this to support more complicated filters
// Requires UX reconsideration
type FilterConditionParams = [
  { column_name: [string] },
  ...{ literal: [unknown] }[]
];
type FilterCondition = Record<string, FilterConditionParams>;

export interface QueryInstanceFilterTransformation {
  type: 'filter';
  spec: FilterCondition;
}

export interface QueryInstanceSummarizationTransformation {
  type: 'summarize';
  spec: {
    grouping_expressions: [
      { input_alias: string; output_alias: string; preproc?: string },
    ];
    aggregation_expressions: {
      input_alias: string;
      output_alias: string;
      function: 'aggregate_to_array' | 'count';
    }[];
  };
  display_names: Record<string, string>;
}

export type QueryInstanceTransformation =
  | QueryInstanceFilterTransformation
  | QueryInstanceSummarizationTransformation;

export interface QueryInstance {
  readonly id: number;
  readonly name: string;
  readonly base_table: number;
  readonly initial_columns?: QueryInstanceInitialColumn[];
  readonly transformations?: QueryInstanceTransformation[];
}

export interface QueryGetResponse extends QueryInstance {
  readonly schema: number;
}

/**
 * endpoint: /api/db/v0/queries/
 */

export type QueriesList = PaginatedResponse<QueryInstance>;

/**
 * endpoint: /api/db/v0/queries/<query_id>/records/
 */

export type QueryResultRecords = PaginatedResponse<Record<string, unknown>>;

/**
 * endpoint: /api/db/v0/queries/<query_id>/columns/
 */

export interface QueryResultColumn {
  alias: string;
  display_name: string | null;
  type: Column['type'];
  type_options: Column['type_options'];
  display_options: Column['display_options'];
}

export type QueryResultColumns = QueryResultColumn[];

/**
 * endpoint: /api/db/v0/queries/<query_id>/run/
 */

export interface QueryRunRequest {
  base_table: QueryInstance['base_table'];
  initial_columns: QueryInstanceInitialColumn[];
  transformations?: QueryInstanceTransformation[];
  parameters: {
    order_by?: {
      field: QueryColumnAlias;
      direction: 'asc' | 'desc';
    }[];
    limit: number;
    offset: number;
  };
}

export type QueryColumnMetaData = QueryResultColumn;

export interface QueryRunResponse {
  query: {
    schema: SchemaEntry['id'];
    base_table: QueryInstance['base_table'];
    initial_columns: QueryInstanceInitialColumn[];
    transformations?: QueryInstanceTransformation[];
  };
  records: QueryResultRecords;
  output_columns: QueryColumnAlias[];
  column_metadata: Record<string, QueryColumnMetaData>;
}
