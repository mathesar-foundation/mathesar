import { execPipe, some } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import { WritableSet } from '@mathesar-component-library';

import type { EphemeralDataForm } from './EphemeralDataForm';
// eslint-disable-next-line import/no-cycle
import { EphermeralFkField } from './EphemeralFkField';
import { EphermeralScalarField } from './EphemeralScalarField';
import type { FieldColumn } from './FieldColumn';
import type {
  EphemeralDataFormField,
  EphemeralDataFormFieldProps,
  ParentEphemeralDataFormField,
} from './types';

function fieldPropToEphemeralField(
  fieldProps: EphemeralDataFormFieldProps,
  holder: FormFields,
): EphemeralDataFormField {
  if (fieldProps.kind === 'scalar_column') {
    return new EphermeralScalarField(holder, fieldProps);
  }

  return new EphermeralFkField(holder, fieldProps);
}

export class FormFields {
  readonly parent;

  private fieldSet: WritableSet<EphemeralDataFormField>;

  private sortedFields: Readable<EphemeralDataFormField[]>;

  constructor(
    parent: EphemeralDataForm | ParentEphemeralDataFormField,
    fieldProps: Iterable<EphemeralDataFormFieldProps>,
  ) {
    this.parent = parent;
    const ephemeralFormFields = [...fieldProps].map((fieldProp) =>
      fieldPropToEphemeralField(fieldProp, this),
    );
    this.fieldSet = new WritableSet(ephemeralFormFields);
    this.sortedFields = derived<
      WritableSet<EphemeralDataFormField>,
      EphemeralDataFormField[]
    >(
      this.fieldSet,
      ($fieldSet, set) => {
        let unsubIndexStores: (() => void)[] = [];

        function updateSorted() {
          set(
            [...$fieldSet.values()].sort((a, b) => get(a.index) - get(b.index)),
          );
        }

        function resubscribe() {
          unsubIndexStores.forEach((u) => u());
          unsubIndexStores = [];

          unsubIndexStores = [...$fieldSet.values()].map((item) =>
            item.index.subscribe(updateSorted),
          );
        }

        resubscribe();
        updateSorted();
        return () => unsubIndexStores.forEach((u) => u());
      },
      [],
    );
  }

  subscribe(run: Subscriber<EphemeralDataFormField[]>): Unsubscriber {
    return this.sortedFields.subscribe(run);
  }

  hasColumn(fc: FieldColumn) {
    return derived(this.fieldSet, ($fieldSet) =>
      execPipe(
        $fieldSet.values(),
        some((f) => f.hasColumn(fc)),
      ),
    );
  }

  getTableOid() {
    return 'relatedTableOid' in this.parent
      ? this.parent.relatedTableOid
      : this.parent.baseTableOid;
  }

  reconstruct(dataFormFieldProps: Iterable<EphemeralDataFormFieldProps>) {
    this.fieldSet.reconstruct(
      [...dataFormFieldProps].map((fieldProp) =>
        fieldPropToEphemeralField(fieldProp, this),
      ),
    );
  }

  add(dataFormFieldProps: EphemeralDataFormFieldProps) {
    if (!get(this.hasColumn(dataFormFieldProps.fieldColumn))) {
      const dataFormField = fieldPropToEphemeralField(dataFormFieldProps, this);
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) >= fieldIndex) {
          field.updateIndex((index) => index + 1);
        }
      }
      this.fieldSet.add(dataFormField);
    }
  }

  delete(dataFormField: EphemeralDataFormField) {
    const fieldIndex = get(dataFormField.index);
    for (const field of get(this.fieldSet)) {
      if (get(field.index) > fieldIndex) {
        field.updateIndex((index) => index - 1);
      }
    }
    this.fieldSet.delete(dataFormField);
  }
}
