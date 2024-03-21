/**
 * Performs branching logic by exhaustively pattern-matching all variants of a
 * TypeScript discriminated union.
 *
 * @param value The value to match
 * @param property The name of the discriminant property
 * @param cases An object representing the match arms. It should have one entry
 * per variant of the union. The key should be the value of the discriminant
 * property for that variant, and the value should be a function that takes the
 * value of that variant and returns the result of the match arm.
 *
 * @example
 *
 * ```ts
 * type Shape =
 *   | { kind: 'circle'; radius: number }
 *   | { kind: 'square'; x: number }
 *   | { kind: 'triangle'; x: number; y: number };
 *
 * function area(shape: Shape) {
 *   return match(shape, 'kind', {
 *     circle: ({ radius }) => Math.PI * radius ** 2,
 *     square: ({ x }) => x ** 2,
 *     triangle: ({ x, y }) => (x * y) / 2,
 *   });
 * }
 * ```
 */
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
