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
 * - `removeInvalidCharacters`
 */
export function removeExtraneousMinusSigns(input: string): string {
  const isNegative = !!/^-/.exec(input);
  const cleanedInput = input.replace(/-/g, '');
  return `${isNegative ? '-' : ''}${cleanedInput}`;
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
    `(^|[^\\d])(?=${escapeRegex(opts.decimalSeparator)})`,
  );
  return (input: string) => input.replace(pattern, '$10');
}

/**
 * Requires the following cleaners to be run first:
 * - `removeInvalidCharacters`
 * - `convertCommasToDots`
 */
export function removePrecedingZeros(input: string): string {
  return input.replace(/^(-?)0*(?!\.|$)/, '$1');
}

/**
 * Requires the following cleaners to be run first:
 * - `removeInvalidCharacters`
 * - `convertCommasToDots`
 */
export function removeTrailingDecimalZeros(input: string): string {
  return input.replace(/(\.(?:[1-9]|0(?=0*[1-9]))*)(0*)$/, '$1');
}

/**
 * Requires the following cleaners to be run first:
 * - `prependShorthandDecimalWithZero`
 * - `removeInvalidCharacters`
 * - `convertCommasToDots`
 * - `removeTrailingDecimalZeros`
 */
export function removeTrailingDecimalSeparator(input: string): string {
  return input.replace(/\.$/, '');
}

/**
 * Produces a cleaner comprised of multiple cleaners which run in sequence.
 */
function cleanInSequence(cleaners: Cleaner[]): Cleaner {
  return (input: string) => cleaners.reduce((i, cleaner) => cleaner(i), input);
}

/**
 * Returns a `simplify` function which converts a string representation of a
 * number into "Simplified form".
 *
 * A string number in "Simplified form" has the following characteristics:
 *
 * - Common characteristics (for "Simplified" and "Normalized"):
 *
 *     - Can be fed into `parseFloat` and `parseInt`.
 *     - Uses dot as the decimal separator, regardless of locale.
 *     - Does not use any grouping separators.
 *     - Does not have any invalid characters.
 *
 * - Special characteristics:
 *
 *     - It retains characteristics within the result that we can use to infer
 *       formatting settings to produce the `intermediateDisplay` value. For
 *       example, the trailing zeros will be retained, and a trailing decimal
 *       will be retained. This means that the same number can be represented
 *       multiple simplified ways.
 */
export function factoryToSimplify(
  opts: Pick<
    DerivedOptions,
    'allowNegative' | 'decimalSeparator' | 'allowFloat'
  >,
): (input: string) => string {
  return cleanInSequence([
    forceAsciiMinusSign,
    factoryToRemoveInvalidCharacters(opts),
    removeExtraneousMinusSigns,
    factoryToRemoveExtraneousDecimalSeparators(opts),
    convertCommasToDots,
    factoryToPrependShorthandDecimalWithZero(opts),
    removePrecedingZeros,
  ]);
}

/**
 * Returns a `normalize` function which converts a string representation of a
 * number into "Normalized form".
 *
 * A string number in "Normalized form" has the following characteristics:
 *
 * - All the "Common characteristics" of "Simplified form" (see above) plus:
 *
 * - Every raw number will be represented the _same way_ in normalized form.
 */
export function factoryToNormalize(
  opts: Pick<
    DerivedOptions,
    'allowNegative' | 'decimalSeparator' | 'allowFloat'
  >,
): (input: string) => string {
  return cleanInSequence([
    factoryToSimplify(opts),
    removeTrailingDecimalZeros,
    removeTrailingDecimalSeparator,
  ]);
}
