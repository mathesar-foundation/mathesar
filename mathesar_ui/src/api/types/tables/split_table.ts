/**
 * This is the POST request for: `/api/db/v0/tables/<table_id>/split_table`
 */
export interface SplitTableRequest {
  extract_columns: number[];
  extracted_table_name: string;
  relationship_fk_column_name?: string;
}

/**
 * This is the POST response for: `/api/db/v0/tables/<table_id>/split_table`
 */
export interface SplitTableResponse {
  extracted_table: number;
  remainder_table: number;
}
