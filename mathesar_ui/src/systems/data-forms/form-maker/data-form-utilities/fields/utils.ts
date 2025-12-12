import { get } from 'svelte/store';

import { ErrorField } from './ErrorField';
import type { DataFormField, ValidDataFormField } from './factories';
import type { FormFields } from './FormFields';

// walks form fields: depth-first
export function* walkFormFields(fields: FormFields): Generator<DataFormField> {
  for (const field of get(fields)) {
    yield field;
    if ('nestedFields' in field) {
      yield* walkFormFields(field.nestedFields);
    }
  }
}

export function getValidFormFields(
  fields: DataFormField[],
): ValidDataFormField[] {
  return fields.filter(
    (f): f is ValidDataFormField => !(f instanceof ErrorField),
  );
}
