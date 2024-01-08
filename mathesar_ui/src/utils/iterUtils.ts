/**
 * Maps the first element of an iterable if that iterable contains exactly one
 * element.
 */
export function mapExactlyOne<T, Z, O, M>(
  iterable: Iterable<T>,
  p: { whenZero: Z; whenOne: (v: T) => O; whenMany: M },
): Z | O | M {
  const iterator = iterable[Symbol.iterator]();
  const first = iterator.next();
  if (first.done) {
    return p.whenZero;
  }
  const second = iterator.next();
  if (second.done) {
    return p.whenOne(first.value);
  }
  return p.whenMany;
}
