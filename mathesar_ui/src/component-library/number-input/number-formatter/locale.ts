/**
 * Get the character that the given locale will use to separate the integer and
 * fractional parts of a number. If no locale is passed, then it will be
 * inferred from the environment.
 */
export function getDecimalSeparator(locale?: string): string {
  // We are formatting a number and then reading the second character of the
  // result. Will this work for all locales? It seems to!
  //
  // You can run this TS in the Deno REPL:
  //
  // ```ts
  // import { getAllLanguageCode } from "https://deno.land/x/language/mod.ts";
  // new Set(getAllLanguageCode().map(c => new Intl.NumberFormat(c).format(1.2)))
  // ```
  //
  // It gives: `Set { "1.2", "1,2", "১.২", "۱٫۲", "१.२" }` which tells me that
  // relying on the second character of the result should work in all locales.
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.2)[1];
  if (!['.', ','].includes(decimalSeparator)) {
    // This is an extra validation step for safety's sake since we'll be using
    // this decimal separator inside a regular expression.
    throw new Error(`Unsupported decimal separator: ${decimalSeparator}`);
  }
  return decimalSeparator;
}
