import { enumerate, execPipe, flatMap, some, toArray } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import { WritableSet, reactiveSort } from '@mathesar-component-library';

import type { DataFormStructure } from '../DataFormStructure';
import type { DataFormStructureChangeEventHandler } from '../DataFormStructureChangeEventHandler';

import type {
  DataFormField,
  DataFormFieldFactory,
  ParentDataFormField,
} from './factories';
import type { FieldColumn } from './FieldColumn';
import type {
  DataFormFieldFkInputValueHolder,
  DataFormFieldInputValueHolder,
} from './FieldValueHolder';
import type { FkField } from './FkField';

export type DataFormFieldContainerFactory = (
  parent: DataFormStructure | ParentDataFormField,
  changeEventHandler: DataFormStructureChangeEventHandler,
) => FormFields;

export type FormFieldContainerChangeEvent =
  | {
      type: 'fields/add';
      target: DataFormStructure | ParentDataFormField;
      field: DataFormField;
    }
  | {
      type: 'fields/delete';
      target: DataFormStructure | ParentDataFormField;
      field: DataFormField;
    }
  | {
      type: 'fields/reconstruct';
      target: DataFormStructure | ParentDataFormField;
    };

export class FormFields {
  readonly parent;

  private fieldSet: WritableSet<DataFormField>;

  private sortedFields: Readable<DataFormField[]>;

  private changeEventHandler: DataFormStructureChangeEventHandler;

  readonly fieldValueStores: Readable<
    (DataFormFieldInputValueHolder | DataFormFieldFkInputValueHolder)[]
  >;

  constructor(
    parent: DataFormStructure | ParentDataFormField,
    fieldFactories: Iterable<DataFormFieldFactory>,
    changeEventHandler: DataFormStructureChangeEventHandler,
  ) {
    this.parent = parent;
    this.changeEventHandler = changeEventHandler;
    const ephemeralFormFields = [...fieldFactories].map((buildField) =>
      buildField(this, this.changeEventHandler),
    );
    this.fieldSet = new WritableSet(ephemeralFormFields);
    this.sortedFields = reactiveSort(
      this.fieldSet.derivedValues(),
      (field) => field.index,
      (a, b) => a - b,
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
      [...fieldFactories].map((factory) =>
        factory(this, this.changeEventHandler),
      ),
    );
    this.changeEventHandler.trigger({
      type: 'fields/reconstruct',
      target: this.parent,
    });
  }

  /**
   * Update each field's `index` store to match the index of the field within
   * the supplied array.
   */
  rearrange(orderedFields: DataFormField[]): void {
    for (const [index, field] of enumerate(orderedFields)) {
      if (get(field.index) === index) continue;
      field.updateIndex(() => index);
    }
  }

  add(createDataFormField: DataFormFieldFactory) {
    const dataFormField = createDataFormField(this, this.changeEventHandler);

    if (!get(this.hasColumn(dataFormField.fieldColumn))) {
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) >= fieldIndex) {
          field.updateIndex((index) => index + 1);
        }
      }
      this.fieldSet.add(dataFormField);
      this.changeEventHandler.trigger({
        type: 'fields/add',
        target: this.parent,
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
    this.changeEventHandler.trigger({
      type: 'fields/delete',
      target: this.parent,
      field: dataFormField,
    });
  }
}
