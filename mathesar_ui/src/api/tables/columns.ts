import type { DbType } from '@mathesar/AppTypes';

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
 * This common for both Number and Money types
 */
interface FormattedNumberDisplayOptions {
  /** When `null`, the browser's locale will be used. */
  number_format: NumberFormat | null;

  /**
   * - "true": display grouping separators even if the locale prefers otherwise.
   * - "false": do not display grouping separators.
   * - "auto": display grouping separators based on the locale preference, which
   *   may also be dependent on the currency"
   */
  use_grouping: 'true' | 'false' | 'auto';

  minimum_fraction_digits: number | null;
  maximum_fraction_digits: number | null;
}

export interface NumberDisplayOptions
  extends Record<string, unknown>,
    FormattedNumberDisplayOptions {}

/**
 * See the [Postgres docs][1] for an explanation of `scale` and `precision`.
 *
 * [1]: https://www.postgresql.org/docs/current/datatype-numeric.html
 */
export interface NumberTypeOptions {
  scale: number;
  precision: number;
}

export interface MoneyDisplayOptions extends FormattedNumberDisplayOptions {
  /**
   * e.g. "$", "€", "NZD", etc.
   */
  currency_symbol: string;

  /**
   * | value            | formatting pattern                           |
   * | ---------------- | -------------------------------------------- |
   * | 'after-minus'    | {minus_sign}{currency_symbol}{number}        |
   * | 'end-with-space' | {minus_sign}{number}{space}{currency_symbol} |
   */
  currency_symbol_location: 'after-minus' | 'end-with-space';

  /**
   * PLANNED FOR FUTURE IMPLEMENTATION POST-ALPHA.
   */
  // use_accounting_notation: boolean;
}

export interface TextTypeOptions extends Record<string, unknown> {
  length: number | null;
}

export interface BooleanDisplayOptions extends Record<string, unknown> {
  input: 'checkbox' | 'dropdown' | null;
  custom_labels: {
    TRUE: string;
    FALSE: string;
  } | null;
}

export type DurationUnit = 'd' | 'h' | 'm' | 's' | 'ms';

export interface DurationDisplayOptions extends Record<string, unknown> {
  min: DurationUnit | null;
  max: DurationUnit | null;
  show_units: boolean | null;
}

export interface BaseColumn {
  id: number;
  name: string;
  type: DbType;
  index: number;
  nullable: boolean;
  primary_key: boolean;
  valid_target_types: DbType[];
  default: {
    is_dynamic: boolean;
    value: unknown;
  } | null;
}

/**
 * TODO:
 *
 * Once we have all column types defined like `NumberColumn` is defined, then
 * convert the `Column` type to a discriminated union of all possible specific
 * column types.
 */
export interface Column extends BaseColumn {
  type_options: Record<string, unknown> | null;
  display_options: Record<string, unknown> | null;
}

// TODO: Remove specification DB types here
export interface NumberColumn extends Column {
  type:
    | 'BIGINT'
    | 'BIGSERIAL'
    | 'DECIMAL'
    | 'DOUBLE PRECISION'
    | 'INTEGER'
    | 'NUMERIC'
    | 'REAL'
    | 'SERIAL'
    | 'SMALLINT'
    | 'SMALLSERIAL';
  type_options: Partial<NumberTypeOptions> | null;
  display_options: Partial<NumberDisplayOptions> | null;
}
