import { getDecimalSeparator } from './locale';

export interface Options {
  locale?: string;
  allowFloat: boolean;
  allowNegative: boolean;
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
