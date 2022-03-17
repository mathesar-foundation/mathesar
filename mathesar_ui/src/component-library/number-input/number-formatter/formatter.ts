import type { DerivedOptions } from './options';
import { forceAsciiMinusSign } from './cleaners';

type Parts = Intl.NumberFormatPart[];

function factoryToAddTrailingDecimalSeparator(
  opts: Pick<DerivedOptions, 'decimalSeparator'>,
): (parts: Parts) => Parts {
  return (parts: Parts) =>
    parts.some((p) => p.type === 'decimal')
      ? parts
      : [...parts, { type: 'decimal', value: opts.decimalSeparator }];
}

function combineParts(parts: Parts): string {
  return parts.map((part) => part.value).join('');
}

export function makeFormatter(opts: DerivedOptions): (value: number) => string {
  function getValidationErrors(value: number) {
    if (Number.isNaN(value)) {
      return ['Value is NaN.'];
    }
    if (!opts.allowNegative && (value < 0 || Object.is(value, -0))) {
      return ['Value must be positive.'];
    }
    if (!opts.allowFloat && value % 1 !== 0) {
      return ['Value must be an integer.'];
    }
    return [];
  }

  function format(value: number): string {
    const validationErrors = getValidationErrors(value);
    if (validationErrors.length) {
      throw new Error(`Unable to format value. ${validationErrors.join(', ')}`);
    }
    const parts = Intl.NumberFormat(opts.locale, {
      // Override the numbering system which is inferred from the locale so that
      // we don't end up with 1.2 formatted as "১.২", "۱٫۲", or "१.२". Users
      // need to be able to enter numbers in the same format which they are
      // displayed, and we don't yet have support to accept entry of numbers in
      // Bengali, Persian, or Marathi.
      numberingSystem: 'latn',
      minimumFractionDigits: opts.minimumFractionDigits,
      // @ts-ignore because TypeScript's Intl.NumberFormatOptions is not up-to-date
      useGrouping: opts.useGrouping,
    }).formatToParts(value);

    const polishers = [];
    if (opts.forceTrailingDecimal) {
      polishers.push(factoryToAddTrailingDecimalSeparator(opts));
    }
    const polishedParts = polishers.reduce((acc, polish) => polish(acc), parts);
    const combinedParts = combineParts(polishedParts);

    // Intl.NumberFormat will use a Unicode minus sign for some locales (e.g.
    // 'li'). We are assuming users in those regions won't mind having an ASCII
    // minus sign instead.
    return forceAsciiMinusSign(combinedParts);
  }

  return format;
}
