import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const data_modeling = {
  move_columns: rpcMethodTypeContainer<
    {
      database_id: number;
      source_table_oid: number;
      target_table_oid: number;
      move_column_attnums: number[];
    },
    void
  >(),

  split_table: rpcMethodTypeContainer<
    {
      database_id: number;
      /** The OID of the table whose columns we’ll extract. */
      table_oid: number;
      /** A list of the attnums of the columns to extract. */
      column_attnums: number[];
      extracted_table_name: string;
      relationship_fk_column_name?: string;
    },
    {
      extracted_table: number;
      fk_column: number;
    }
  >(),

  /**
   * Returns a record where keys are stringified column attnums and values are
   * postgresql types
   */
  suggest_types: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    Record<string, string>
  >(),
};
