import { execPipe, flatMap, some, toArray } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import { WritableSet } from '@mathesar-component-library';

import type { DataFormStructure } from './DataFormStructure';
// eslint-disable-next-line import/no-cycle
import { EphermeralFkField } from './EphemeralFkField';
import { EphermeralScalarField } from './EphemeralScalarField';
import type { FieldColumn } from './FieldColumn';
import type {
  DataFormFieldFkInputValueHolder,
  DataFormFieldInputValueHolder,
} from './FieldValueHolder';
import type {
  EdfFieldListDetail,
  EdfNestedFieldChanges,
  EphemeralDataFormField,
  EphemeralDataFormFieldProps,
  ParentEphemeralDataFormField,
} from './types';

function fieldPropToEphemeralField(
  fieldProps: EphemeralDataFormFieldProps,
  holder: FormFields,
  onChange: (e: EdfNestedFieldChanges) => unknown,
): EphemeralDataFormField {
  if (fieldProps.kind === 'scalar_column') {
    return new EphermeralScalarField(holder, fieldProps, (detail) => {
      onChange(detail);
    });
  }

  return new EphermeralFkField(holder, fieldProps, (detail) => {
    onChange(detail);
  });
}

export class FormFields {
  readonly parent;

  private fieldSet: WritableSet<EphemeralDataFormField>;

  private sortedFields: Readable<EphemeralDataFormField[]>;

  private onChange: (e: EdfFieldListDetail | EdfNestedFieldChanges) => unknown;

  readonly fieldValueStores: Readable<
    (DataFormFieldInputValueHolder | DataFormFieldFkInputValueHolder)[]
  >;

  constructor(
    parent: DataFormStructure | ParentEphemeralDataFormField,
    fieldProps: Iterable<EphemeralDataFormFieldProps>,
    onChange: (e: EdfFieldListDetail | EdfNestedFieldChanges) => unknown,
  ) {
    this.parent = parent;
    this.onChange = onChange;
    const ephemeralFormFields = [...fieldProps].map((fieldProp) =>
      fieldPropToEphemeralField(fieldProp, this, onChange),
    );
    this.fieldSet = new WritableSet(ephemeralFormFields);
    this.sortedFields = derived<
      WritableSet<EphemeralDataFormField>,
      EphemeralDataFormField[]
    >(
      this.fieldSet,
      (_, set) => {
        let unsubIndexStores: (() => void)[] = [];
        const { fieldSet } = this;

        function updateSorted() {
          set(
            [...get(fieldSet).values()].sort(
              (a, b) => get(a.index) - get(b.index),
            ),
          );
        }

        function resubscribe() {
          unsubIndexStores.forEach((u) => u());
          unsubIndexStores = [...get(fieldSet).values()].map((item) =>
            item.index.subscribe(updateSorted),
          );
        }

        resubscribe();
        updateSorted();
        return () => unsubIndexStores.forEach((u) => u());
      },
      [],
    );

    this.fieldValueStores = derived<
      WritableSet<EphemeralDataFormField>,
      DataFormFieldInputValueHolder[]
    >(
      this.fieldSet,
      (_, set) => {
        let unsubFieldValueStores: (() => void)[] = [];
        const { fieldSet } = this;

        function update() {
          set(
            execPipe(
              get(fieldSet).values(),
              flatMap((f) => {
                const stores = [f.fieldValueHolder];
                if (
                  f.kind === 'foreign_key' &&
                  get(f.fieldValueHolder.userAction) === 'create'
                ) {
                  stores.push(...get(f.nestedFields.fieldValueStores));
                }
                return stores;
              }),
              toArray,
            ),
          );
        }

        function resubscribe() {
          unsubFieldValueStores.forEach((u) => u());
          const fkFields = [...get(fieldSet).values()].filter(
            (f): f is EphermeralFkField => f.kind !== 'scalar_column',
          );
          const unsubUserActions = fkFields.map((item) =>
            item.fieldValueHolder.userAction.subscribe(update),
          );
          const unsubNestedFieldValueStores = fkFields.map((item) =>
            item.nestedFields.fieldValueStores.subscribe(update),
          );
          unsubFieldValueStores = [
            ...unsubUserActions,
            ...unsubNestedFieldValueStores,
          ];
        }

        resubscribe();
        update();
        return () => unsubFieldValueStores.forEach((u) => u());
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
        fieldPropToEphemeralField(fieldProp, this, this.onChange),
      ),
    );
    this.onChange({
      type: 'reconstruct',
    });
  }

  add(dataFormFieldProps: EphemeralDataFormFieldProps) {
    if (!get(this.hasColumn(dataFormFieldProps.fieldColumn))) {
      const dataFormField = fieldPropToEphemeralField(
        dataFormFieldProps,
        this,
        this.onChange,
      );
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) >= fieldIndex) {
          field.updateIndex((index) => index + 1);
        }
      }
      this.fieldSet.add(dataFormField);
      this.onChange({
        type: 'add',
        field: dataFormField,
      });
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
    this.onChange({
      type: 'delete',
      field: dataFormField,
    });
  }
}
