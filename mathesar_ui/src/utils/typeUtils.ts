import type { Readable, Writable } from 'svelte/store';
import { MissingExhaustiveConditionError } from './errors';

/**
 * This function is used to assert that the value passed in has been narrowed
 * down to `never` by checking all possible variants.
 */
export function assertExhaustive(value: never): never {
  throw new MissingExhaustiveConditionError(value);
}

type ChangeWritableToReadable<T> = T extends Writable<infer U>
  ? Readable<U>
  : T;

/**
 * This makes all Svelte store properties Readable instead of Writable. With
 * this utility type, we can write a class that has privately writable stores
 * which are read-only publicly, and the the safety check is enforced by TS at
 * compile time.
 */
export type MakeWritablePropertiesReadable<T> = {
  [P in keyof T]: ChangeWritableToReadable<T[P]>;
};

/**
 * This function exists because we don't have `noUncheckedIndexedAccess` enabled
 * yet. See https://github.com/mathesar-foundation/mathesar/issues/1966
 */
export function arrayIndex<T>(a: T[], i: number): T | undefined {
  return a[i];
}
