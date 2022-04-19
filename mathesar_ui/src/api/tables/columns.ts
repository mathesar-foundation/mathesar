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
   * PLANNED FOR FUTURE IMPLEMENTATION POST-ALPHA.
   *
   * - "true": display grouping separators even if the locale prefers otherwise.
   * - "false": do not display grouping separators.
   * - "auto": display grouping separators based on the locale preference, which
   *   may also be dependent on the currency"
   */
  // use_grouping: 'true' | 'false' | 'auto';
}

export interface NumberDisplayOptions
  extends Record<string, unknown>,
    FormattedNumberDisplayOptions {
  show_as_percentage: boolean;
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

export interface BaseColumn {
  id: number;
  name: string;
  type: DbType;
  index: number;
  nullable: boolean;
  primary_key: boolean;
  valid_target_types: DbType[];
}

// TODO convert to discriminated union
export interface Column extends BaseColumn {
  type_options: Record<string, unknown> | null;
  display_options: Record<string, unknown> | null;
}
