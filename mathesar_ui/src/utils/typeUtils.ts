import { MissingExhaustiveConditionError } from './errors';

/**
 * This function is used to assert that the value passed in has been narrowed
 * down to `never` by checking all possible variants.
 */
export function assertExhaustive(value: never): never {
  throw new MissingExhaustiveConditionError(value);
}
