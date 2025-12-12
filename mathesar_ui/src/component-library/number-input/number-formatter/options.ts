import { getDecimalSeparator } from './locale';

export interface Options {
  locale?: string;
  allowFloat: boolean;
  allowNegative: boolean;
  /**
   * Corresponds to the options of the [Intl.NumberFormat][1] API.
   *
   * [1]:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
   */
  useGrouping: 'always' | 'auto' | 'min2' | true | false;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  forceTrailingDecimal: boolean;
}

/**
 * Why don't we have a default locale? Because we want to infer it from the
 * browser.
 */
export const defaultOptions: Options = {
  allowFloat: false,
  allowNegative: false,
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 20,
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
