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
   */
  use_grouping: 'true' | 'false';

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

export type DateFormat = 'none' | 'us' | 'eu' | 'friendly' | 'iso';

export interface DateDisplayOptions extends Record<string, unknown> {
  format: DateFormat | null;
}

export type TimeFormat = '24hr' | '12hr' | '24hrLong' | '12hrLong';

export interface TimeDisplayOptions extends Record<string, unknown> {
  format: TimeFormat | null;
}

export interface TimeStampDisplayOptions extends Record<string, unknown> {
  date_format: DateDisplayOptions['format'];
  time_format: TimeDisplayOptions['format'];
}

export interface BaseColumn {
  id: number;
  name: string;
  description: string | null;
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

export interface MathesarMoneyColumn extends Column {
  type: 'MATHESAR_TYPES.MATHESAR_MONEY';
  type_options: Partial<NumberTypeOptions> | null;
  display_options: Partial<MoneyDisplayOptions> | null;
}

export interface PostgresMoneyColumn extends Column {
  type: 'MONEY';
  type_options: null;
  display_options: Partial<MoneyDisplayOptions> | null;
}

export type MoneyColumn = MathesarMoneyColumn | PostgresMoneyColumn;

// TODO: Remove specification of DB types here
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

export interface ArrayTypeOptions extends Record<string, unknown> {
  item_type: string;
}
