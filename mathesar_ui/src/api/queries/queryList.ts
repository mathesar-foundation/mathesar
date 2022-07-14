import type { PaginatedResponse } from '@mathesar/utils/api';
import type { Column } from '@mathesar/api/tables/columns';
import type { JpPath } from '@mathesar/api/tables/tableList';

/**
 * endpoint: /api/db/v0/queries/<query_id>/
 */

export interface QueryInstance {
  readonly id: number;
  readonly name: string;
  readonly base_table?: number;
  readonly initial_columns?: {
    alias: string;
    column: Column['id'];
    jpPath?: JpPath;
  }[];
}

/**
 * endpoint: /api/db/v0/queries/
 */

export type QueriesList = PaginatedResponse<QueryInstance>;
