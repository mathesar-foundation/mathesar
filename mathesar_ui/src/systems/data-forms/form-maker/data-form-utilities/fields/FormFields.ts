import { enumerate, execPipe, flatMap, some, toArray } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import {
  WritableSet,
  asyncDynamicDerived,
  reactiveSort,
} from '@mathesar-component-library';

import type {
  DataFormStructure,
  DataFormStructureCtx,
} from '../DataFormStructure';

import type {
  DataFormField,
  DataFormFieldFactory,
  ParentDataFormField,
} from './factories';
import type { FieldColumn } from './FieldColumn';
import type { DataFormFieldInputValueHolder } from './FieldValueHolder';
import type { FkField } from './FkField';
import { getValidFormFields } from './utils';

export type DataFormFieldContainerFactory = (
  parent: DataFormStructure | ParentDataFormField,
  structureCtx: DataFormStructureCtx,
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

export class FormFields implements Readable<DataFormField[]> {
  readonly parent;

  private fieldSet: WritableSet<DataFormField>;

  private sortedFields: Readable<DataFormField[]>;

  private structureCtx: DataFormStructureCtx;

  readonly fieldValueStores: Readable<DataFormFieldInputValueHolder[]>;

  constructor(
    parent: DataFormStructure | ParentDataFormField,
    fieldFactories: Iterable<DataFormFieldFactory>,
    structureCtx: DataFormStructureCtx,
  ) {
    this.parent = parent;
    this.structureCtx = structureCtx;
    const ephemeralFormFields = [...fieldFactories].map((buildField) =>
      buildField(this, this.structureCtx),
    );
    this.fieldSet = new WritableSet(ephemeralFormFields);
    this.sortedFields = reactiveSort(
      this.fieldSet.derivedValues(),
      (field) => field.index,
      (a, b) => a - b,
    );

    this.fieldValueStores = asyncDynamicDerived<
      Iterable<DataFormField>,
      DataFormFieldInputValueHolder[]
    >(
      this.fieldSet,
      (fieldSetValues) => {
        const fkFields = [...fieldSetValues].filter(
          (f): f is FkField => f.kind === 'foreign_key',
        );

        return fkFields.flatMap((item) => [
          item.nestedFields.fieldValueStores,
          item.fieldValueHolder.userAction,
        ]);
      },
      (fieldSetValues, _get) =>
        execPipe(
          [...fieldSetValues],
          flatMap((f) => {
            const stores = 'fieldValueHolder' in f ? [f.fieldValueHolder] : [];
            if (
              f.kind === 'foreign_key' &&
              _get(f.fieldValueHolder.userAction) === 'create'
            ) {
              stores.push(..._get(f.nestedFields.fieldValueStores));
            }
            return stores;
          }),
          toArray,
        ),
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
        some((f) => 'hasColumn' in f && f.hasColumn(fc)),
      ),
    );
  }

  getTableOid() {
    return 'relatedTableOid' in this.parent
      ? this.parent.relatedTableOid
      : this.parent.baseTableOid;
  }

  reconstructWithFields(dataFormFields: DataFormField[]) {
    if (
      dataFormFields.some(
        (field) =>
          field.container !== this || field.structureCtx !== this.structureCtx,
      )
    ) {
      throw new Error(
        'The provided form fields do not reference this container. This should never occur.',
      );
    }

    this.fieldSet.reconstruct(dataFormFields);
    this.structureCtx.changeEventHandler?.trigger({
      type: 'fields/reconstruct',
      target: this.parent,
    });
  }

  reconstruct(fieldFactories: Iterable<DataFormFieldFactory>) {
    this.fieldSet.reconstruct(
      [...fieldFactories].map((factory) => factory(this, this.structureCtx)),
    );
    this.structureCtx.changeEventHandler?.trigger({
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
    const dataFormField = createDataFormField(this, this.structureCtx);
    const isFieldColumnBased = 'fieldColumn' in dataFormField;
    const canAddField =
      !isFieldColumnBased || !get(this.hasColumn(dataFormField.fieldColumn));

    if (canAddField) {
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) >= fieldIndex) {
          field.updateIndex((index) => index + 1);
        }
      }
      this.fieldSet.add(dataFormField);
      this.structureCtx.changeEventHandler?.trigger({
        type: 'fields/add',
        target: this.parent,
        field: dataFormField,
      });
    }
  }

  delete(dataFormField: DataFormField) {
    if (dataFormField.canDelete) {
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) > fieldIndex) {
          field.updateIndex((index) => index - 1);
        }
      }
      this.fieldSet.delete(dataFormField);
      this.structureCtx.changeEventHandler?.trigger({
        type: 'fields/delete',
        target: this.parent,
        field: dataFormField,
      });
    }
  }

  toRawFields(options?: { withoutErrorFields: boolean }) {
    const fields = get(this);
    const fieldsToReturn = options?.withoutErrorFields
      ? getValidFormFields(fields)
      : fields;
    return fieldsToReturn.map((field) => field.toRawEphemeralField(options));
  }
}
