import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface RawTable {
  oid: number;
  name: string;
  /** The OID of the schema containing the table */
  schema: number;
  description: string | null;
}

interface TableMetadata {
  import_verified: boolean | null;
  column_order: number[] | null;
  record_summary_customized: boolean | null;
  record_summary_template: string | null;
}

export interface Table extends RawTable {
  metadata: TableMetadata | null;
}

/** [table oid, column attnum][] */
export type JoinPath = [number, number][];

export interface JoinableTable {
  base: Table['oid'];
  target: Table['oid'];
  join_path: JoinPath;
  /**
   * [Constraint OID, is_reversed]
   *
   * When is_reversed is `false`, following the join path constitutes following
   * a foreign key relationship from the base table to the target table. For
   * example, following a join from `books` to `authors` when one book has one
   * author.
   *
   * When is_reversed is `true`, following the join path constitutes following
   * a foreign key relationship from the target table to the base table. For
   * example, following a join from `authors` to `books` when one author has
   * many books.
   */
  fkey_path: [number, boolean][];
  depth: number;
  multiple_results: boolean;
}

export interface JoinableTablesResult {
  joinable_tables: JoinableTable[];
  tables: Record<
    string, // stringified table_oid
    {
      name: Table['name'];
      columns: number[];
    }
  >;
  columns: Record<
    string, // stringified column_oid
    {
      name: string;
      type: string;
    }
  >;
}

export const tables = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
    },
    RawTable[]
  >(),

  list_with_metadata: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
    },
    Table[]
  >(),

  get: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    RawTable
  >(),

  get_with_metadata: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    Table
  >(),

  /** Returns the oid of the table created */
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
      table_name?: string;
      comment?: string;
      /** TODO */
      column_data_list?: unknown;
      /** TODO */
      constraint_data_list?: unknown;
    },
    number
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      table_data_dict: {
        name?: string;
        description?: string | null;
      };
    },
    void
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      cascade?: boolean;
    },
    void
  >(),

  list_joinable: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
    },
    JoinableTablesResult
  >(),
};
