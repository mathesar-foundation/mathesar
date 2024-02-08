export function match<
  /** Discriminant Property name */
  P extends string,
  /** The other stuff in the type (besides the discriminant property) */
  O,
  /** The union valued type */
  V extends Record<P, string> & O,
  /** The match arms */
  C extends { [K in V[P]]: (v: Extract<V, Record<P, K>>) => unknown },
>(value: V, property: P, cases: C) {
  return cases[value[property]](
    value as Extract<V, Record<P, string>>,
  ) as ReturnType<C[keyof C]>;
}
