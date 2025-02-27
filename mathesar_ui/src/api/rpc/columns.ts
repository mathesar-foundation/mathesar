import { DEFAULT_COLUMN_WIDTH_PX } from '@mathesar/geometry';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export type BooleanInputType = 'checkbox' | 'dropdown';

/**
 * | value     | example locale | example format |
 * | --------- | -------------- | -------------- |
 * | 'english' | 'en'           |   '-123,456.7' |
 * | 'german'  | 'de'           |   '-123.456,7' |
 * | 'french'  | 'fr'           |   '-123 456,7' |
 * | 'hindi'   | 'hi'           |  '-1,23,456.7' |
 * | 'swiss'   | 'de-CH'        |   '-123'456.7' |
 */
export type NumberFormat = 'english' | 'german' | 'french' | 'hindi' | 'swiss';

/**
 * Corresponds to the Intl.NumberFormat options `useGrouping`.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#usegrouping
 *
 * - `"always"` - Display grouping separators even if the locale prefers
 *   otherwise.
 * - `"auto"` - Display grouping separators based on the locale preference,
 *   which may also be dependent on the currency.
 * - `"never"` - Do not display grouping separators.
 */
export type NumberGrouping = 'always' | 'auto' | 'never';

/**
 * | value            | formatting pattern                           |
 * | ---------------- | -------------------------------------------- |
 * | 'after-minus'    | {minus_sign}{currency_symbol}{number}        |
 * | 'end-with-space' | {minus_sign}{number}{space}{currency_symbol} |
 */
export type CurrencyLocation = 'after-minus' | 'end-with-space';

export const allDurationUnits = ['d', 'h', 'm', 's', 'ms'] as const;

export type DurationUnit = (typeof allDurationUnits)[number];

export type DateFormat = 'none' | 'us' | 'eu' | 'friendly' | 'iso';

export type TimeFormat = '24hr' | '12hr' | '24hrLong' | '12hrLong';

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

/**
 * The column metadata values, typed as we need in order to render them in the
 * UI.
 */
export interface RequiredColumnMetadata {
  /** The type of input used for boolean values */
  bool_input: BooleanInputType;

  /** The text to display for a boolean `true` value */
  bool_true: string;

  /** The text to display for a boolean `false` value */
  bool_false: string;

  /** The minimum number of fraction digits to display for a number */
  num_min_frac_digits: number;

  /** The maximum number of fraction digits to display for a number */
  num_max_frac_digits: number;

  /** When `null`, the browser's locale will be used. */
  num_format: NumberFormat | null;

  num_grouping: NumberGrouping;

  /** The currency symbol to show for a money type e.g. "$", "€", "NZD", etc. */
  mon_currency_symbol: string;

  mon_currency_location: CurrencyLocation;

  time_format: TimeFormat;

  date_format: DateFormat;

  duration_min: DurationUnit;

  duration_max: DurationUnit;

  /** The pixel width of the column */
  display_width: number;
}

/** The column metadata values, types as we get them from the API. */
export type ColumnMetadata = {
  [K in keyof RequiredColumnMetadata]?: RequiredColumnMetadata[K] | null;
};

export const defaultColumnMetadata: RequiredColumnMetadata = {
  bool_input: 'checkbox',
  bool_true: 'true',
  bool_false: 'false',
  num_min_frac_digits: 0,
  num_max_frac_digits: 20,
  num_format: null,
  num_grouping: 'auto',
  mon_currency_symbol: '$',
  mon_currency_location: 'after-minus',
  time_format: '24hr',
  date_format: 'none',
  duration_min: 's',
  duration_max: 'm',
  display_width: DEFAULT_COLUMN_WIDTH_PX,
};

/**
 * Gets a metadata value from a column, if present. Otherwise returns the
 * default value for that metadata value.
 */
export function getColumnMetadataValue<
  Key extends keyof RequiredColumnMetadata,
>(column: Pick<Column, 'metadata'>, k: Key) {
  return column.metadata?.[k] ?? defaultColumnMetadata[k];
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
  valid_target_types: string[];
  current_role_priv: ColumnPrivilege[];
}

/**
 * The raw column data from the user database combined with Mathesar's metadata
 */
export interface Column extends RawColumn {
  metadata: ColumnMetadata | null;
}

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
    Column[]
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
};
