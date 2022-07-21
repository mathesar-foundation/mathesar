import type { PartiallyMissingOrUndefined } from '../types/utilityTypes';

export function withoutUndefinedValues<T>(
  object: PartiallyMissingOrUndefined<T> = {},
): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function withDefaults<T>(
  defaults: T,
  supplied: PartiallyMissingOrUndefined<T> = {},
): T {
  return {
    ...defaults,
    ...withoutUndefinedValues(supplied),
  };
}
