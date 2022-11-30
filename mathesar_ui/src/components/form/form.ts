import { derived, get, writable, type Readable } from 'svelte/store';

import { unite } from '@mathesar-component-library';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import { comboErrorsKey, type FieldStore, type ValuedField } from './field';
import { isValid as outcomeIsValid, type ComboValidator } from './validators';

type GenericFieldsObj = Record<string, FieldStore>;
type Values<FieldsObj extends GenericFieldsObj> = {
  [K in keyof FieldsObj]: FieldsObj[K] extends FieldStore<infer T> ? T : never;
};

function runComboValidators(
  valuedFields: ValuedField[],
  comboValidators: ComboValidator[],
): void {
  const fieldErrorMap = new Map<FieldStore, string[]>();
  comboValidators.forEach((validator) => {
    const { outcome, fields } = validator(valuedFields);
    fields.forEach((field) => {
      const errors = fieldErrorMap.get(field) ?? [];
      const newErrors = outcomeIsValid(outcome) ? [] : [outcome.errorMsg];
      fieldErrorMap.set(field, [...errors, ...newErrors]);
    });
  });
  for (const [field, newErrors] of fieldErrorMap) {
    const errors = get(field[comboErrorsKey]);
    if (JSON.stringify(errors) !== JSON.stringify(newErrors)) {
      field[comboErrorsKey].set(newErrors);
    }
  }
}

export function makeForm<FieldsObj extends GenericFieldsObj>(
  fields: FieldsObj,
  comboValidators: ComboValidator[] = [],
) {
  const valuedFields: Readable<ValuedField[]> = unite(
    Object.entries(fields).map(([name, field]) =>
      derived(field, (value) => ({ name, field, value })),
    ),
  );
  const values = derived(valuedFields, ($valuedFields) => {
    runComboValidators($valuedFields, comboValidators);
    return Object.fromEntries(
      $valuedFields.map(({ name, value }) => [name, value]),
    ) as Values<FieldsObj>;
  });

  const requestStatus = writable<RequestStatus | undefined>(undefined);

  const isValid = derived(
    unite(Object.values(fields).map((f) => f.isValid)),
    (a) => a.every((i) => i),
  );
  const canSubmit = derived(
    unite(Object.values(fields).map((f) => f.canSubmit)),
    (a) => a.every((i) => i),
  );
  const hasChanges = derived(
    unite(Object.values(fields).map((f) => f.hasChanges)),
    (a) => a.some((i) => i),
  );

  function clearServerErrors() {
    requestStatus.update((v) => (v?.state === 'failure' ? undefined : v));
    Object.values(fields).forEach((field) => {
      field.serverErrors.set([]);
    });
  }

  function reset() {
    clearServerErrors();
    Object.values(fields).forEach((field) => {
      field.reset();
    });
  }

  const store = derived(
    [values, isValid, canSubmit, hasChanges],
    ([$values, $isValid, $canSubmit, $hasChanges]) => ({
      values: $values,
      isValid: $isValid,
      canSubmit: $canSubmit,
      hasChanges: $hasChanges,
    }),
  );

  return { ...store, fields, reset, clearServerErrors, requestStatus };
}

export type Form<FieldsObj extends GenericFieldsObj = GenericFieldsObj> =
  ReturnType<typeof makeForm<FieldsObj>>;
