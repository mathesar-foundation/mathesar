import { getDecimalSeparator } from './locale';

export interface Options {
  locale?: string;
  allowFloat: boolean;
  allowNegative: boolean;
  /**
   * Corresponds to the options of the [Intl.NumberFormat][1] API.
   *
   * The MDN docs say that "true" and "false" are accepted as strings, but in my
   * testing with Firefox and Chromium, I noticed that those values need to be
   * passed as booleans to work correctly.
   *
   * [1]:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
   */
  useGrouping: boolean | 'auto';
  minimumFractionDigits: number;
  forceTrailingDecimal: boolean;
}

/**
 * Why don't we have a default locale? Because we want to infer it from the
 * browser.
 */
export const defaultOptions: Options = {
  allowFloat: false,
  allowNegative: false,
  useGrouping: 'auto',
  minimumFractionDigits: 0,
  forceTrailingDecimal: false,
};

export interface DerivedOptions extends Options {
  decimalSeparator: string;
}

export function getDerivedOptions(options: Options): DerivedOptions {
  return {
    ...options,
    decimalSeparator: getDecimalSeparator(options.locale),
  };
}
