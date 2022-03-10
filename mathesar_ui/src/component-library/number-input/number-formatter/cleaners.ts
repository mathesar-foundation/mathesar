import { escapeRegex } from '@mathesar-component-library-dir/common/utils/stringUtils';
import type { DerivedOptions } from './options';

type Cleaner = (input: string) => string;

export function forceAsciiMinusSign(input: string): string {
  const otherSigns = [
    '\u2010',
    '\u2011',
    '\u2012',
    '\u2013',
    '\u2014',
    '\u2015',
    '\u2043',
    '\u2212',
    '\uFE63',
    '\uFF0D',
  ];
  return input.replace(new RegExp(`[${otherSigns.join('')}]`, 'g'), '-');
}

/**
 * Requires the following cleaners to be run first:
 * - `forceAsciiMinusSign`
 */
export function removeExtraneousMinusSigns(input: string): string {
  return input.replace(/(?<!^)-/g, '');
}

export function convertCommasToDots(input: string): string {
  return input.replace(/,/g, '.');
}

/**
 * Requires the following cleaners to be run first:
 * - `forceAsciiMinusSign`
 */
export function factoryToRemoveInvalidCharacters(
  opts: Pick<
    DerivedOptions,
    'allowNegative' | 'decimalSeparator' | 'allowFloat'
  >,
): Cleaner {
  const validCharacterPatterns = [
    // Allow all digits.
    String.raw`\d`,
    // Allow minus sign, only if permitted.
    ...(opts.allowNegative ? [escapeRegex('-')] : []),
    // Allow decimal separator, only if permitted.
    ...(opts.allowFloat ? [escapeRegex(opts.decimalSeparator)] : []),
  ];
  const invalidCharacterPattern = new RegExp(
    `[^${validCharacterPatterns.join('')}]`,
    'g',
  );
  return (input: string) => input.replace(invalidCharacterPattern, '');
}

export function factoryToRemoveExtraneousDecimalSeparators(
  opts: Pick<DerivedOptions, 'decimalSeparator'>,
): Cleaner {
  const maxCount = 1;
  return (input: string) =>
    input.split(opts.decimalSeparator).reduce((result, piece, index) => {
      if (result === undefined) {
        return piece;
      }
      const glue = index <= maxCount ? opts.decimalSeparator : '';
      return `${result}${glue}${piece}`;
    });
}

/**
 * Requires the following cleaners to be run first:
 * - `removeInvalidCharacters` - because grouping characters need to be removed.
 * - `convertCommasToDots`
 */
export function factoryToPrependShorthandDecimalWithZero(
  opts: Pick<DerivedOptions, 'decimalSeparator'>,
): Cleaner {
  const pattern = new RegExp(
    `(?<!\\d)(?=${escapeRegex(opts.decimalSeparator)})`,
  );
  return (input: string) => input.replace(pattern, '0');
}

/**
 * Returns a `normalize` function whose goals are:
 * - Produce a string that can be fed into `parseFloat`.
 * - Retain characteristics within the result that we can use to infer
 *   formatting settings to produce the `intermediateDisplay` value. For
 *   example, the trailing zeros will be retained.
 * - Remove useless stuff like grouping characters and invalid characters.
 */
export function factoryToNormalize(
  opts: Pick<
    DerivedOptions,
    'allowNegative' | 'decimalSeparator' | 'allowFloat'
  >,
): (input: string) => string {
  /**
   * The order of cleaners is important. See notes within each cleaner about its
   * dependencies.
   */
  const cleaners = [
    forceAsciiMinusSign,
    factoryToRemoveInvalidCharacters(opts),
    removeExtraneousMinusSigns,
    factoryToRemoveExtraneousDecimalSeparators(opts),
    convertCommasToDots,
    factoryToPrependShorthandDecimalWithZero(opts),
  ];
  return (input: string) => cleaners.reduce((i, cleaner) => cleaner(i), input);
}
