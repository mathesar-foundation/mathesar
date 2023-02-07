import type { Truthy } from '@mathesar/types';
import { MissingExhaustiveConditionError } from './errors';

/**
 * This function is used to assert that the value passed in has been narrowed
 * down to `never` by checking all possible variants.
 */
export function assertExhaustive(value: never): never {
  throw new MissingExhaustiveConditionError(value);
}

export function truthy<T>(value: T): value is Truthy<T> {
  return !!value;
}
