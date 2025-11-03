import { DEFAULT_COLUMN_WIDTH_PX } from '@mathesar/geometry';

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

  /** TODO: document this once the backend implementation is more settled */
  file_backend: string | null;

  /** Whether this column stores Mathesar user IDs */
  user_type: boolean | null;
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
  file_backend: null,
  user_type: null,
};

/**
 * Gets a metadata value, if present. Otherwise returns the default value for
 * that metadata property.
 */
export function getMetadataValue<Key extends keyof RequiredColumnMetadata>(
  metadata: ColumnMetadata,
  k: Key,
) {
  return metadata[k] ?? defaultColumnMetadata[k];
}
