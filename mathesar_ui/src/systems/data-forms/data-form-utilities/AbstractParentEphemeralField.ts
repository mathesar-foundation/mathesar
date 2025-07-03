import { type Readable, get } from 'svelte/store';

import { type ImmutableMap, WritableMap } from '@mathesar-component-library';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';

export abstract class AbstractParentEphemeralField extends AbstractEphemeralField {
  protected _nestedFields;

  get nestedFields(): Readable<
    ImmutableMap<EphemeralDataFormField['key'], EphemeralDataFormField>
  > {
    return this._nestedFields;
  }

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & {
      nestedFields: Iterable<EphemeralDataFormField>;
    },
  ) {
    super(parentField, data);
    this._nestedFields = new WritableMap(
      [...data.nestedFields].map((f) => [f.key, f]),
    );
  }

  setNestedFields(nestedFields: Iterable<EphemeralDataFormField>) {
    this._nestedFields.reconstruct([...nestedFields].map((f) => [f.key, f]));
  }

  removeNestedField(dataFormField: EphemeralDataFormField) {
    this._nestedFields.delete(dataFormField.key);
  }

  protected getBaseFieldRawJson() {
    const base = super.getBaseFieldRawJson();
    return {
      ...base,
      child_fields: [...get(this.nestedFields).values()].map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
