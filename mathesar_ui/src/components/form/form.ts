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

  function reset() {
    Object.values(fields).forEach((field) => {
      field.reset();
    });
  }

  const requestStatus = writable<RequestStatus | undefined>(undefined);

  const serverErrors = writable<string[]>([]);

  const isValid = derived(
    unite(Object.values(fields).map((f) => f.isValid)),
    (a) => a.every((i) => i),
  );
  const isDirty = derived(
    unite(Object.values(fields).map((f) => f.isDirty)),
    (a) => a.some((i) => i),
  );

  const store = derived(
    [values, isValid, isDirty],
    ([$values, $isValid, $isDirty]) => ({
      values: $values,
      isValid: $isValid,
      isDirty: $isDirty,
    }),
  );

  return { ...store, fields, reset, serverErrors, requestStatus };
}

export type Form<FieldsObj extends GenericFieldsObj = GenericFieldsObj> =
  ReturnType<typeof makeForm<FieldsObj>>;
