import { get } from 'svelte/store';
import type { FieldStore, FieldValue, ValuedField } from './field';

export type Filled<T> = Exclude<T, null | undefined>;

export type Valid = { type: 'valid' };
export type Invalid = { type: 'invalid'; errorMsg: string };
export type ValidationOutcome = Valid | Invalid;

export function isInvalid(v: ValidationOutcome): v is Invalid {
  return v.type === 'invalid';
}
export function isValid(v: ValidationOutcome): v is Valid {
  return v.type === 'valid';
}

export type ValidationFn<T> = (v: T) => ValidationOutcome;

export function valid(): Valid {
  return { type: 'valid' };
}

export function invalid(errorMsg: string): Invalid {
  return { type: 'invalid', errorMsg };
}

export function validIf<T>(
  fn: (v: T) => boolean,
  msg: string,
): ValidationFn<T> {
  return (v) => (fn(v) ? valid() : invalid(msg));
}

export function invalidIf<T>(
  fn: (v: T) => boolean,
  msg: string,
): ValidationFn<T> {
  return (v) => (fn(v) ? invalid(msg) : valid());
}

function valueIsFilled<T>(v: T | undefined | null): v is T {
  return (
    v !== undefined &&
    v !== null &&
    v !== '' &&
    (Array.isArray(v) ? v.length !== 0 : true)
  );
}

type FilledFieldValue<F> = FieldValue<F> extends infer T | undefined | null
  ? T
  : never;

const REQUIRED_VALIDATION_MSG = 'Value cannot be empty.';

export function required(msg = REQUIRED_VALIDATION_MSG): ValidationFn<unknown> {
  return validIf((v) => valueIsFilled(v), msg);
}

export function uniqueWith<T>(
  values: T[],
  msg = 'This value already exists.',
): ValidationFn<T> {
  return invalidIf((v) => values.includes(v), msg);
}

export function min(lowerBound: number, msg?: string): ValidationFn<number> {
  return validIf(
    (v) => v >= lowerBound,
    msg ?? `Value must be at least ${lowerBound}.`,
  );
}

export function max(upperBound: number, msg?: string): ValidationFn<number> {
  return validIf(
    (v) => v <= upperBound,
    msg ?? `Value must be at most ${upperBound}.`,
  );
}

export function matchRegex(regex: RegExp, msg: string): ValidationFn<string> {
  return validIf((v) => !!v.match(regex), msg);
}

export function maxLength(limit: number, msg?: string): ValidationFn<string> {
  return validIf(
    (v) => v.length <= limit,
    msg ?? `Value cannot be longer than ${limit} characters.`,
  );
}

/**
 * From https://stackoverflow.com/a/46181/895563
 */
const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmail(
  msg = 'The email address is invalid.',
): ValidationFn<string> {
  return validIf((v) => !!v.toLowerCase().match(EMAIL_PATTERN), msg);
}

export function getErrors<T>({
  value,
  isRequired,
  validators,
}: {
  value: T;
  isRequired: boolean;
  validators?: (ValidationFn<T> | ValidationFn<Filled<T>>)[];
}): string[] {
  if (!valueIsFilled(value)) {
    return isRequired ? [REQUIRED_VALIDATION_MSG] : [];
  }
  if (!validators) {
    return [];
  }
  // We know value will be filled here because we already returned if
  // `valueIsFilled` gave false.
  const filledValue = value as Filled<T>;
  return validators
    .map((fn) => fn(filledValue))
    .filter(isInvalid)
    .map(({ errorMsg }) => errorMsg);
}

interface ComboValidationOutcome {
  outcome: ValidationOutcome;
  fields: FieldStore[];
}

export type ComboValidator = (
  valuedFields: ValuedField[],
) => ComboValidationOutcome;

type FieldsTuple = [FieldStore<unknown>, ...Array<FieldStore<unknown>>];
type ValuesTuple<Fields extends FieldsTuple> = {
  [K in keyof Fields]: FilledFieldValue<Fields[K]>;
};
type ComboValidatorFn<Fields extends FieldsTuple> = (
  values: ValuesTuple<Fields>,
) => ValidationOutcome;
type SimpleComboValidatorFn<Fields extends FieldsTuple> = (
  values: ValuesTuple<Fields>,
) => boolean;

function isIncomplete(v: Pick<ValuedField, 'field' | 'value'>): boolean {
  return v.field.isRequired && !valueIsFilled(v.value);
}

export function comboValidator<Fields extends FieldsTuple>(
  fields: Fields,
  fn: ComboValidatorFn<Fields>,
): ComboValidator {
  return (allValuedFields) => {
    const givenValuedFields = fields.map(
      (field) =>
        allValuedFields.find((i) => i.field === field) ?? {
          field,
          value: get(field),
        },
    );
    if (givenValuedFields.map(isIncomplete).some((v) => v)) {
      // If any required fields are missing values, we skip evaluating the combo
      // validator
      return { outcome: valid(), fields };
    }
    const values = givenValuedFields.map(
      (field) => field.value,
    ) as ValuesTuple<Fields>;
    return { outcome: fn(values), fields };
  };
}

export function comboInvalidIf<Fields extends FieldsTuple>(
  fields: Fields,
  fn: SimpleComboValidatorFn<Fields>,
  msg: string,
): ComboValidator {
  return comboValidator(fields, invalidIf(fn, msg));
}

export function comboValidIf<Fields extends FieldsTuple>(
  fields: Fields,
  fn: SimpleComboValidatorFn<Fields>,
  msg: string,
): ComboValidator {
  return comboValidator(fields, validIf(fn, msg));
}

function allArrayValuesAreEqual(values: unknown[]): boolean {
  let previousValue = values[0];
  for (const value of values) {
    if (value !== previousValue) {
      return false;
    }
    previousValue = value;
  }
  return true;
}

export function comboMustBeEqual<Fields extends FieldsTuple>(
  fields: Fields,
  msg: string,
): ComboValidator {
  return comboValidIf(fields, allArrayValuesAreEqual, msg);
}
