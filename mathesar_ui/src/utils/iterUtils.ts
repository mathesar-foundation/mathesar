export function cartesianProduct<T, U>(
  a: Iterable<T>,
  b: Iterable<U>,
): Iterable<[T, U]> {
  return {
    *[Symbol.iterator]() {
      for (const x of a) {
        for (const y of b) {
          yield [x, y];
        }
      }
    },
  };
}
