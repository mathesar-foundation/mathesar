import { execPipe, flatMap, some, toArray } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import type { RawDataFormField } from '@mathesar/api/rpc/forms';
import { WritableSet } from '@mathesar-component-library';

import type {
  DataFormField,
  DataFormFieldFactory,
  ParentDataFormField,
} from './DataFormField';
import type { DataFormStructure } from './DataFormStructure';
import type { FieldColumn } from './FieldColumn';
import type {
  DataFormFieldFkInputValueHolder,
  DataFormFieldInputValueHolder,
} from './FieldValueHolder';
// eslint-disable-next-line import/no-cycle
import { FkField } from './FkField';
import type { FormSource } from './FormSource';
import { ScalarField } from './ScalarField';
import type { EdfFieldListDetail, EdfNestedFieldChanges } from './types';

export type DataFormFieldsOnChange = (
  e: EdfFieldListDetail | EdfNestedFieldChanges,
) => unknown;

export type DataFormFieldContainerFactory = (
  parent: DataFormStructure | ParentDataFormField,
  onChange: DataFormFieldsOnChange,
) => FormFields;

export class FormFields {
  readonly parent;

  private fieldSet: WritableSet<DataFormField>;

  private sortedFields: Readable<DataFormField[]>;

  private onChange: DataFormFieldsOnChange;

  readonly fieldValueStores: Readable<
    (DataFormFieldInputValueHolder | DataFormFieldFkInputValueHolder)[]
  >;

  constructor(
    parent: DataFormStructure | ParentDataFormField,
    fieldsFactories: Iterable<DataFormFieldFactory>,
    onChange: DataFormFieldsOnChange,
  ) {
    this.parent = parent;
    this.onChange = onChange;
    const ephemeralFormFields = [...fieldsFactories].map((fieldFactory) =>
      fieldFactory(this, (detail: EdfNestedFieldChanges) => onChange(detail)),
    );
    this.fieldSet = new WritableSet(ephemeralFormFields);
    this.sortedFields = derived<WritableSet<DataFormField>, DataFormField[]>(
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
      WritableSet<DataFormField>,
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
            (f): f is FkField => f.kind !== 'scalar_column',
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

  subscribe(run: Subscriber<DataFormField[]>): Unsubscriber {
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

  reconstruct(fieldFactories: Iterable<DataFormFieldFactory>) {
    this.fieldSet.reconstruct(
      [...fieldFactories].map((factory) => factory(this, this.onChange)),
    );
    this.onChange({
      type: 'reconstruct',
    });
  }

  add(factory: DataFormFieldFactory) {
    const dataFormField = factory(this, (e) => this.onChange(e));

    if (!get(this.hasColumn(dataFormField.fieldColumn))) {
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

  delete(dataFormField: DataFormField) {
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

  static factoryFromRawInfo(
    props: {
      parentTableOid: number;
      rawDataFormFields: RawDataFormField[];
    },
    formSource: FormSource,
  ): DataFormFieldContainerFactory {
    return (
      parent: DataFormStructure | ParentDataFormField,
      onChange: DataFormFieldsOnChange,
    ) =>
      new FormFields(
        parent,
        props.rawDataFormFields.map((f) => {
          if (f.kind === 'scalar_column') {
            return ScalarField.factoryFromRawInfo(
              {
                parentTableOid: props.parentTableOid,
                rawField: f,
              },
              formSource,
            );
          }
          return FkField.factoryFromRawInfo(
            {
              parentTableOid: props.parentTableOid,
              rawField: f,
            },
            formSource,
          );
        }),
        onChange,
      );
  }
}
