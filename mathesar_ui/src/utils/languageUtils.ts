import { assertExhaustive } from '@mathesar-component-library';

export function makeSingular(word: string): string {
  return word.length > 1 ? word.replace(/s$/i, '') : word;
}

export function makeSentenceCase(text: string): string {
  return (text[0]?.toLocaleUpperCase() ?? '') + text.slice(1);
}

export function makeTitleCase(text: string): string {
  return text.split(' ').map(makeSentenceCase).join(' ');
}

export type Countable =
  | number
  | Array<unknown>
  | { size: number }
  | Iterable<unknown>;

function getCount(countable: Countable): number {
  if (typeof countable === 'number') {
    return countable;
  }
  if (countable instanceof Array) {
    return countable.length;
  }
  if ('size' in countable) {
    return countable.size;
  }
  if (
    typeof countable === 'object' &&
    typeof countable[Symbol.iterator] === 'function'
  ) {
    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const i of countable) {
      count += 1;
    }
    return count;
  }
  return 0;
}

function getNumericPluralRule(
  count: number,
  locale = 'en-US',
): Intl.LDMLPluralRule {
  if (typeof Intl === 'object' && typeof Intl.PluralRules === 'function') {
    return new Intl.PluralRules(locale).select(count);
  }
  if (count === 0) {
    return 'zero';
  }
  if (count === 1) {
    return 'one';
  }
  if (count === 2) {
    return 'two';
  }
  return 'many';
}

function getCountablePluralRule(
  countable: Countable,
  locale = 'en-US',
): Intl.LDMLPluralRule {
  return getNumericPluralRule(getCount(countable), locale);
}

type PluralForms = Record<Intl.LDMLPluralRule, string>;

function makePluralFormsFromEnglish(one: string, many: string): PluralForms {
  return {
    zero: many,
    one,
    two: many,
    few: many,
    many,
    other: many,
  };
}

const wordMap = {
  cells: makePluralFormsFromEnglish('cell', 'cells'),
  columns: makePluralFormsFromEnglish('column', 'columns'),
  explorations: makePluralFormsFromEnglish('exploration', 'explorations'),
  filters: makePluralFormsFromEnglish('filter', 'filters'),
  matches: makePluralFormsFromEnglish('match', 'matches'),
  records: makePluralFormsFromEnglish('record', 'records'),
  rows: makePluralFormsFromEnglish('row', 'rows'),
  results: makePluralFormsFromEnglish('result', 'results'),
  schemas: makePluralFormsFromEnglish('schema', 'schemas'),
  tables: makePluralFormsFromEnglish('table', 'tables'),
  times: makePluralFormsFromEnglish('time', 'times'),
  values: makePluralFormsFromEnglish('value', 'values'),
} as const;

type Word = keyof typeof wordMap;

function caseString(
  value: string,
  casing: 'lower' | 'title' | 'sentence' = 'lower',
): string {
  switch (casing) {
    case 'title':
      return makeTitleCase(value);
    case 'sentence':
      return makeSentenceCase(value);
    default:
      return value;
  }
}

/**
 * - `'lower'` - e.g. "2 query parameters"
 * - `'title'` - e.g. "2 Query Parameters"
 * - `'sentence'` - e.g. "2 Query parameters"
 */
type Casing = 'lower' | 'title' | 'sentence';

/**
 * Makes text like "table", or "tables".
 *
 * @param countable A number, array, object with a size property, or iterable
 * @param word A word to pluralize. Must be in {@link wordMap}.
 * @param casing Specifies how the result will be capitalized. Defaults to
 * `'lower'`.
 *
 * @example
 * ```ts
 * pluralize(1, 'tables') // => "table"
 * pluralize(2, 'tables', 'title') // => "2 Tables"
 * ```
 */
export function pluralize(
  countable: Countable,
  word: Word,
  casing: Casing = 'lower',
): string {
  const result = wordMap[word][getCountablePluralRule(countable)];
  return caseString(result, casing);
}

/**
 * - `'numeric'` means show the count as a number
 *
 * - `{ word: string }` means show the count as the given word. For example, `{
 *   word: 'one' }` will display the count as "one".
 */
type CountWhenZero = 'numeric' | { word: string };

/**
 * - `'hidden'` means don't show the count at all
 *
 * @see {@link CountWhenZero} for other options
 */
type CountWhenSingular = CountWhenZero | 'hidden';

function getCountText(
  count: number,
  countWhenZero: CountWhenZero,
  countWhenSingular: CountWhenSingular,
): string {
  if (count === 0) {
    if (countWhenZero === 'numeric') {
      return String(count);
    }
    if ('word' in countWhenZero) {
      return countWhenZero.word;
    }
    assertExhaustive(countWhenZero);
  }
  if (count === 1) {
    if (countWhenSingular === 'numeric') {
      return String(count);
    }
    if (countWhenSingular === 'hidden') {
      return '';
    }
    if ('word' in countWhenSingular) {
      return countWhenSingular.word;
    }
    assertExhaustive(countWhenSingular);
  }
  return String(count);
}

/**
 * Makes text like "2 tables" or "Exploration" or "no matches"
 *
 * @param countable A number, array, object with a size property, or iterable
 * @param word A word to pluralize. Must be in {@link wordMap}.
 * @param options An object which allowing adjustment of the output formatting.
 * See further documentation for each parameter's type.
 *
 * @example
 * ```ts
 *
 * labeledCount(0, 'tables',
 *   { countWhenZero: { word: 'No' }, casing: 'title' }
 * ) // => "No Tables"
 *
 * labeledCount(1, 'tables',
 *   { countWhenSingular: 'hidden', casing: 'title' }
 * ) // => "Table"
 *
 * labeledCount(2, 'tables') // => "2 tables"
 * ```
 */
export function labeledCount(
  countable: Countable,
  word: Word,
  {
    casing,
    countWhenZero = 'numeric',
    countWhenSingular = 'numeric',
  }: {
    casing?: Casing;
    countWhenZero?: CountWhenZero;
    countWhenSingular?: CountWhenSingular;
  } = {},
): string {
  const count = getCount(countable);
  const countText = getCountText(count, countWhenZero, countWhenSingular);
  const label = pluralize(count, word, casing);
  return [countText, label].filter(Boolean).join(' ');
}
