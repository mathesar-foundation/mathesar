import { get } from 'svelte/store';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';
import { FormFields } from './FormFields';

export abstract class AbstractParentEphemeralField extends AbstractEphemeralField {
  nestedFields: FormFields;

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & {
      nestedFields: Iterable<EphemeralDataFormField>;
    },
  ) {
    super(parentField, data);
    this.nestedFields = new FormFields(data.nestedFields);
  }

  protected getBaseFieldRawJson() {
    const base = super.getBaseFieldRawJson();
    return {
      ...base,
      child_fields: get(this.nestedFields).map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
