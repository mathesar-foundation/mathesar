/**
 * Returns an iterable that yields the elements of the input iterable, but
 * starting from the first element that satisfies the given predicate.
 */
export function* startingFrom<T>(
  iter: Iterable<T>,
  isFirstElement: (i: T) => boolean,
): Generator<T> {
  let found = false;
  for (const i of iter) {
    if (found || isFirstElement(i)) {
      found = true;
      yield i;
    }
  }
}

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

/**
 * If the iterable contains exactly one element, returns that element. Otherwise
 * returns undefined.
 */
export function takeFirstAndOnly<T>(iterable: Iterable<T>): T | undefined {
  return mapExactlyOne(iterable, {
    whenZero: undefined,
    whenOne: (v) => v,
    whenMany: undefined,
  });
}

/**
 * We need to ensure these two scenarios w.r.t types,
 *
 * 1. const [rpcErrors, stringErrors] = partition(errors, (err) => err instanceof RpcError);
 * Here rpcErrors has to be type Iterable<RpcError>, and stringErrors has to be Iterable<string>
 *
 * 2. const [known, unknown] = partition(rpcErrors, (err) => KnownRPCErrors.has(err.code));
 * Both known and unknown need to be of the type Iterable<RpcError>
 */
type Remaining<Base, Filtered> = Exclude<Base, Filtered> extends never
  ? Base
  : Exclude<Base, Filtered>;

export function partition<T, U extends T>(
  iterable: Iterable<T>,
  condition: ((item: T) => item is U) | ((item: T) => boolean),
): [Iterable<U>, Iterable<Remaining<T, U>>] {
  function* filterIterable(value: boolean): Generator<T> {
    for (const item of iterable) {
      if (condition(item) === value) {
        yield item;
      }
    }
  }

  return [
    filterIterable(true) as Iterable<U>,
    filterIterable(false) as Iterable<Remaining<T, U>>,
  ];
}

export function partitionAsArray<T, U extends T>(
  iterable: Iterable<T>,
  condition: ((item: T) => item is U) | ((item: T) => boolean),
): [U[], Remaining<T, U>[]] {
  const result = partition(iterable, condition);
  return [[...result[0]], [...result[1]]];
}
