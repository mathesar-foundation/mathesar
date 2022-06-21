/**
 * This is sort of how `Partial` behaves when `exactOptionalPropertyTypes` is
 * `false`. Even though we have [exactOptionalPropertyTypes][1] set to `false`,
 * I'd like to start using this utility type in place of `Partial` where
 * appropriate because it will help us transition to setting
 * `exactOptionalPropertyTypes` to `true` at some point in the future.
 *
 * [1]: https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes
 */
export type PartiallyMissingOrUndefined<T> = {
  [P in keyof T]?: T[P] | undefined;
};
