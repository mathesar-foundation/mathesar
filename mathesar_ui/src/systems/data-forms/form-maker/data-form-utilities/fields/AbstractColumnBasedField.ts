import { type Readable, get, writable } from 'svelte/store';

import type { RawDataFormField } from '@mathesar/api/rpc/forms';
import type { getDbTypeBasedInputCap } from '@mathesar/components/cell-fabric/utils';

import type { DataFormStructureCtx } from '../DataFormStructure';

import {
  AbstractField,
  type AbstractFieldModifiableProps,
  type AbstractFieldProps,
} from './AbstractField';
import type { FieldColumn } from './FieldColumn';
import { DataFormFieldScalarInputValueHolder } from './FieldValueHolder';
import type { FormFields } from './FormFields';

export interface AbstractColumnBasedFieldProps extends AbstractFieldProps {
  isRequired: RawDataFormField['is_required'];
  fieldColumn: FieldColumn;
}

export type AbstractColumnBasedFieldModifiableProps =
  | AbstractFieldModifiableProps
  | keyof Pick<AbstractColumnBasedFieldProps, 'isRequired'>;

export abstract class AbstractColumnBasedField extends AbstractField {
  readonly fieldColumn;

  readonly fieldValueHolder: DataFormFieldScalarInputValueHolder;

  abstract readonly inputComponentAndProps: Readable<
    ReturnType<typeof getDbTypeBasedInputCap>
  >;

  private _isRequired;

  get isRequired(): Readable<AbstractColumnBasedFieldProps['isRequired']> {
    return this._isRequired;
  }

  readonly canDelete: boolean;

  constructor(
    holder: FormFields,
    props: AbstractColumnBasedFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    super(holder, props, structureCtx);
    this.fieldColumn = props.fieldColumn;
    this._isRequired = writable(
      this.fieldColumn.column.nullable ? props.isRequired : true,
    );
    this.fieldValueHolder = new DataFormFieldScalarInputValueHolder(
      this.key,
      this.isRequired,
    );
    this.canDelete = !!this.fieldColumn.column.nullable;
  }

  setIsRequired(isRequired: boolean) {
    if (!this.fieldColumn.column.nullable) {
      // required on db
      throw new Error(
        'Cannot modify isRequired since this field is not nullable on the DB',
      );
    }
    this._isRequired.set(isRequired);
    this.triggerChangeEvent('isRequired');
  }

  hasColumn(fieldColumn: FieldColumn) {
    return (
      this.fieldColumn.tableOid === fieldColumn.tableOid &&
      this.fieldColumn.column.id === fieldColumn.column.id
    );
  }

  checkAndSetDefaultLabel() {
    const label = get(this.label);
    if (!label || label.trim() === '') {
      this.setLabel(this.fieldColumn.column.name);
    }
  }

  protected abstract triggerChangeEvent<
    T extends keyof Pick<
      AbstractColumnBasedFieldProps,
      'index' | 'label' | 'help' | 'styling' | 'isRequired'
    >,
  >(e: T): unknown;

  protected getBaseFieldRawJson() {
    return {
      ...super.getBaseFieldRawJson(),
      column_attnum: this.fieldColumn.column.id,
      is_required: get(this.isRequired),
    };
  }
}
