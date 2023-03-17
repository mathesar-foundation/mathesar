import { derived, writable, type Readable, type Writable } from 'svelte/store';

import { getErrors, type Filled, type ValidationFn } from './validators';

export const comboErrorsKey = Symbol('comboErrors');

export interface BaseField<T> extends Writable<T> {
  initialValue: T;
  /**
   * True when the value has been changed from the initial value. Values are
   * compared by equality.
   */
  hasChanges: Readable<boolean>;
  /**
   * Client-side errors from validators directly on this field.
   */
  fieldErrors: Readable<string[]>;
  /**
   * This property stores the errors computed from combo validators.
   *
   * It's a Symbol because we don't want to allow public access to it, but we do
   * want to allow the form to write to it.
   */
  [comboErrorsKey]: Writable<string[]>;
  /**
   * Only includes the client-side errors generated from combo validators.
   */
  comboErrors: Readable<string[]>;
  /**
   * Errors from the server after submitting the form.
   */
  serverErrors: Writable<string[]>;
  /**
   * Includes:
   *
   * - `fieldErrors`
   * - `comboErrors`
   */
  errors: Readable<string[]>;
  /**
   * True when there are no errors.
   */
  isValid: Readable<boolean>;
  /**
   * The form can be submitted with server errors, but not with client errors.
   */
  canSubmit: Readable<boolean>;
  /**
   * True when there are errors and the value has been changed. This can be used
   * to set CSS classes and such.
   */
  showsError: Readable<boolean>;
  reset: () => void;
}

export interface RequiredField<T> extends BaseField<T> {
  isRequired: true;
}
export interface OptionalField<T> extends BaseField<T> {
  isRequired: false;
}
export type FieldStore<T = unknown> = RequiredField<T> | OptionalField<T>;

export interface BaseFieldProps<T> {
  initialValue: T;
}
export interface RequiredFieldProps<T> extends BaseFieldProps<T> {
  isRequired: true;
  validators?: ValidationFn<Filled<T>>[];
}
export interface OptionalFieldProps<T> extends BaseFieldProps<T> {
  isRequired: false;
  validators?: ValidationFn<T>[];
}
export type FieldProps<T> = RequiredFieldProps<T> | OptionalFieldProps<T>;

export function field<T>(props: RequiredFieldProps<T>): RequiredField<T>;
export function field<T>(props: OptionalFieldProps<T>): OptionalField<T>;
export function field<T>(props: FieldProps<T>): FieldStore<T>;
export function field<T>(props: FieldProps<T>): FieldStore<T> {
  const value = writable(props.initialValue);
  const serverErrors = writable<string[]>([]);
  const hasChanges = derived(value, (v) => v !== props.initialValue);
  const fieldErrors = derived(value, (v) => {
    // Whenever the value changes, we clear the server errors to provide for a
    // clean UX while the user is fixing them.
    serverErrors.set([]);
    return getErrors({ ...props, value: v });
  });
  const writableComboErrors = writable<string[]>([]);
  const comboErrors = derived(writableComboErrors, (e) => e);
  const errorStores = [fieldErrors, comboErrors, serverErrors];
  const errors = derived(errorStores, (a) => a.flat());
  const isValid = derived(errors, (e) => e.length === 0);
  const canSubmit = derived(
    [fieldErrors, comboErrors],
    (a) => a.flat().length === 0,
  );
  const showsError = derived(
    [hasChanges, fieldErrors, comboErrors, serverErrors],
    ([$hasChanges, $fieldErrors, $comboErrors, $serverErrors]) => {
      if ($comboErrors.length || $serverErrors.length) {
        // If we have combo or server errors, then we force display of errors
        // even if there are no changes.
        return true;
      }
      if (!$hasChanges) {
        // Hide field errors when the field still has its initial value. This
        // makes forms with required fields look nicer because they load without
        // any error messages displaying.
        return false;
      }
      return $fieldErrors.length > 0;
    },
  );
  return {
    isRequired: props.isRequired,
    initialValue: props.initialValue,
    hasChanges,
    fieldErrors,
    [comboErrorsKey]: writableComboErrors,
    comboErrors,
    serverErrors,
    errors,
    isValid,
    canSubmit,
    showsError,
    subscribe(run: (v: T) => void, invalidate?: (v?: T) => void) {
      return value.subscribe(run, invalidate);
    },
    set(v: T) {
      value.set(v);
    },
    update(fn: (v: T) => T) {
      value.update(fn);
    },
    reset() {
      value.set(props.initialValue);
    },
  };
}

export function optionalField<T>(
  initialValue: T,
  validators: ValidationFn<T>[] = [],
): OptionalField<T> {
  return field({ initialValue, validators, isRequired: false });
}

export function requiredField<T>(
  initialValue: T,
  validators: ValidationFn<Filled<T>>[] = [],
): RequiredField<T> {
  return field({ initialValue, validators, isRequired: true });
}

export type FieldValue<F> = F extends FieldStore<infer Value> ? Value : never;

export interface ValuedField<T = unknown> {
  name: string;
  field: FieldStore<T>;
  value: T;
}
