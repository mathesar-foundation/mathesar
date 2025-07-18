import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import {
  type ColumnMetadata,
  type RequiredColumnMetadata,
  getMetadataValue,
} from './_common/columnDisplayOptions';

/**
 * See the [Postgres docs][1] for an explanation of `scale` and `precision`.
 *
 * [1]: https://www.postgresql.org/docs/current/datatype-numeric.html
 */
export interface ColumnTypeOptions {
  /**
   * For numeric types, the number of significant digits. For date/time types,
   * the number of fractional digits.
   */
  precision?: number | null;

  /** For numeric types, the number of fractional digits. */
  scale?: number | null;

  /** Which time fields are stored. See Postgres docs. */
  fields?: string | null;

  /** The maximum length of a character-type field. */
  length?: number | null;

  /** The member type for arrays.  */
  item_type?: string | null;
}

interface ColumnDefault {
  value: string;
  is_dynamic: boolean;
}

export const allColumnPrivileges = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'REFERENCES',
] as const;
export type ColumnPrivilege = (typeof allColumnPrivileges)[number];

/** The raw column data, from the user database only */
interface RawColumn {
  /** The PostgreSQL attnum of the column */
  id: number;
  name: string;
  description: string | null;
  /** The PostgreSQL data type */
  type: string;
  type_options: ColumnTypeOptions | null;
  nullable: boolean;
  primary_key: boolean;
  default: ColumnDefault | null;
  has_dependents: boolean;
  current_role_priv: ColumnPrivilege[];
}

/**
 * The raw column data from the user database combined with Mathesar's metadata
 */
export interface RawColumnWithMetadata extends RawColumn {
  metadata: ColumnMetadata | null;
}

/**
 * Gets a metadata value from a column, if present. Otherwise returns the
 * default value for that metadata value.
 */
export function getColumnMetadataValue<
  Key extends keyof RequiredColumnMetadata,
>(column: Pick<RawColumnWithMetadata, 'metadata'>, k: Key) {
  return getMetadataValue(column.metadata ?? {}, k);
}

/**
 * The ColumnCastOptions are returned when getting column type suggestions. They
 * are not inspected or used directly by the front end, but instead passed back
 * to the tables.get_import_preview and/or columns.patch endpoints as needed if
 * the user accepts Mathesar's type suggestions.
 */
export type ColumnCastOptions = Record<string, unknown>;

export interface ColumnCreationSpec {
  name?: string;
  type?: string;
  description?: string;
  type_options?: ColumnTypeOptions;
  nullable?: boolean;
  default?: ColumnDefault;
}

export interface ColumnPatchSpec {
  id: number;
  name?: string;
  type?: string | null;
  description?: string | null;
  type_options?: ColumnTypeOptions | null;
  cast_options?: ColumnCastOptions;
  nullable?: boolean;
  default?: ColumnDefault | null;
}

type ColumnMetadataBlob = ColumnMetadata & { attnum: number };

export const columns = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    RawColumn[]
  >(),

  list_with_metadata: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    RawColumnWithMetadata[]
  >(),

  /** Returns an array of the attnums of the newly-added columns */
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      column_data_list: ColumnCreationSpec[];
    },
    number[]
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      column_data_list: ColumnPatchSpec[];
    },
    void
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      column_attnums: number[];
    },
    void
  >(),

  metadata: {
    set: rpcMethodTypeContainer<
      {
        database_id: number;
        table_oid: number;
        column_meta_data_list: ColumnMetadataBlob[];
      },
      void
    >(),
  },

  add_primary_key_column: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      pkey_type: 'IDENTITY' | 'UUIDv4';
      drop_existing_pkey_column?: boolean;
      name?: string;
    },
    void
  >(),
};
