import type { PaginatedResponse } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';
import type { JpPath } from '@mathesar/api/tables';

/**
 * endpoint: /api/db/v0/queries/<query_id>/
 */

export interface QueryInstanceInitialColumn {
  alias: string;
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
