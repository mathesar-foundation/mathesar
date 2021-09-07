export const isEmpty = <T>(arr: T[]): boolean => arr.length === 0;
export const notEmpty = <T>(arr: T[]): boolean => !isEmpty(arr);

export function intersection<T>(a: Set<T>, b: Set<T>): Array<T> {
  const elsThatBothSetsHave = Array.from(a).filter((el) => b.has(el));
  return elsThatBothSetsHave;
}

/**
 * Devised for easy type declaration when constructing a two-element tuple (a pair). Useful when
 * using the Map constructor to turn an array of pairs into a Map.
 *
 * Javascript doesn't distinguish arrays and tuples, but Typescript does and requires a verbose
 * type declaration to make the distinction (see return value). This function solves that.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map
 */
export function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b] as [A, B];
}
