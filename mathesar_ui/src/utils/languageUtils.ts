const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

export function getArticleForWord(word: string): string {
  return vowels.has(word[0]?.toLowerCase()) ? 'an' : 'a';
}

export function makeSingular(word: string): string {
  return word.length > 1 ? word.replace(/s$/i, '') : word;
}

export function makeSentenceCase(text: string): string {
  return (text[0]?.toLocaleLowerCase() ?? '') + text.slice(1);
}

export function makeTitleCase(text: string): string {
  return text.split(' ').map(makeSentenceCase).join(' ');
}

type Countable = number | Array<unknown> | { size: number } | Iterable<unknown>;

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
  schemas: makePluralFormsFromEnglish('schema', 'schemas'),
  tables: makePluralFormsFromEnglish('table', 'tables'),
  explorations: makePluralFormsFromEnglish('exploration', 'explorations'),
  columns: makePluralFormsFromEnglish('column', 'columns'),
  records: makePluralFormsFromEnglish('record', 'records'),
  matches: makePluralFormsFromEnglish('match', 'matches'),
  results: makePluralFormsFromEnglish('result', 'results'),
} as const;

type Word = keyof typeof wordMap;

export function pluralize(
  countable: Countable,
  word: Word,
  casing: 'lower' | 'title' | 'sentence' = 'lower',
): string {
  const result = wordMap[word][getCountablePluralRule(countable)];
  switch (casing) {
    case 'title':
      return makeTitleCase(result);
    case 'sentence':
      return makeSentenceCase(result);
    default:
      return result;
  }
}

export function labeledCount(
  countable: Countable,
  word: Word,
  casing?: 'lower' | 'title' | 'sentence',
): string {
  const count = getCount(countable);
  const label = pluralize(count, word, casing);
  return `${count} ${label}`;
}
