export const isEmpty = <T>(arr: T[]): boolean => arr.length === 0;
export const notEmpty = <T>(arr: T[]): boolean => !isEmpty(arr);

export function intersection<T>(a: Set<T>, b: Set<T>): Array<T> {
  const elsThatBothSetsHave = Array.from(a).filter((el) => b.has(el));
  return elsThatBothSetsHave;
}

export function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b] as [A, B];
}
