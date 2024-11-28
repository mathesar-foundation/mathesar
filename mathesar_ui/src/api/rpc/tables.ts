import type { RecursivePartial } from '@mathesar/component-library';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { ColumnTypeOptions } from './columns';
import type { RawDatabase } from './databases';
import type { RawRole } from './roles';

export const allTablePrivileges = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
] as const;
export type TablePrivilege = (typeof allTablePrivileges)[number];

export interface RawTable {
  oid: number;
  name: string;
  /** The OID of the schema containing the table */
  schema: number;
  description: string | null;
  owner_oid: RawRole['oid'];
  current_role_priv: TablePrivilege[];
  current_role_owns: boolean;
}

export interface RawTablePrivilegesForRole {
  role_oid: RawRole['oid'];
  direct: TablePrivilege[];
}

/**
 * A string is static text to be displayed in the summary.
 *
 * An array of numbers indicates a reference to a column in the table. Each
 * number is a column attnum. A sequence of multiple numbers indicates a chain
 * of FK references, column-by-column.
 *
 */
export type RecordSummaryTemplatePart = string | number[];
export type RecordSummaryTemplate = RecordSummaryTemplatePart[];

interface TableMetadata {
  /** The id of the data file used during import while creating the table */
  data_file_id: number | null;
  /**
   * When `true` or `null`, the table has been imported from a data file and the
   * data has been verified to be correct, with the data types customized by the
   * user.
   *
   * When false, the table still requires import verification before it can be
   * viewed in the table page.
   */
  import_verified: boolean | null;
  column_order: number[] | null;
  record_summary_template: RecordSummaryTemplate | null;
}

export interface RawTableWithMetadata extends RawTable {
  metadata: TableMetadata | null;
}

/** [table oid, column attnum][] */
export type JoinPath = [number, number][][];

export interface JoinableTable {
  target: RawTableWithMetadata['oid'];
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
  /** Keys are stringified table OID values */
  target_table_info: Record<
    string,
    {
      name: RawTableWithMetadata['name'];
      /** Keys are stringified column attnum values */
      columns: Record<
        string,
        {
          name: string;
          type: string;
        }
      >;
    }
  >;
}

/**
 * The parameters needed for one column in order to generate an import preview.
 */
export interface ColumnPreviewSpec {
  /** Column attnum */
  id: number;
  /** The new type to be applied to the column */
  type?: string;
  type_options?: ColumnTypeOptions | null;
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
    RawTableWithMetadata[]
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
    RawTableWithMetadata
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
    {
      oid: number;
      name: string;
    }
  >(),

  /** Returns the oid of the table created */
  import: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
      table_name?: string;
      comment?: string;
      data_file_id: number;
    },
    {
      oid: number;
      name: string;
    }
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
      table_oid: number;
      max_depth?: number;
    },
    JoinableTablesResult
  >(),

  get_import_preview: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      columns: ColumnPreviewSpec[];
      /** The upper limit for the number of records to return. Defaults to 20 */
      limit?: number;
    },
    Record<string, unknown>[]
  >(),

  metadata: {
    list: rpcMethodTypeContainer<{ database_id: number }, TableMetadata[]>(),

    set: rpcMethodTypeContainer<
      {
        database_id: number;
        table_oid: number;
        metadata: RecursivePartial<TableMetadata>;
      },
      void
    >(),
  },

  privileges: {
    list_direct: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        table_oid: RawTable['oid'];
      },
      Array<RawTablePrivilegesForRole>
    >(),

    replace_for_roles: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        table_oid: RawTable['oid'];
        privileges: Array<RawTablePrivilegesForRole>;
      },
      Array<RawTablePrivilegesForRole>
    >(),

    transfer_ownership: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        table_oid: RawTable['oid'];
        new_owner_oid: RawRole['oid'];
      },
      RawTable
    >(),
  },
};
