import { type Readable, derived, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawDataFormField } from '@mathesar/api/rpc/forms';
import {
  getDbTypeBasedInputCap,
  getLinkedRecordInputCap,
} from '@mathesar/components/cell-fabric/utils';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';

import {
  AbstractField,
  type AbstractFieldModifiableProps,
  type AbstractFieldProps,
} from './AbstractField';
import type { FieldColumn } from './FieldColumn';
import { DataFormFieldInputValueHolder } from './FieldValueHolder';
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

  readonly fieldValueHolder: DataFormFieldInputValueHolder;

  readonly inputComponentAndProps;

  private _isRequired;

  get isRequired(): Readable<AbstractColumnBasedFieldProps['isRequired']> {
    return this._isRequired;
  }

  constructor(holder: FormFields, props: AbstractColumnBasedFieldProps) {
    super(holder, props);
    this.fieldColumn = props.fieldColumn;
    this._isRequired = writable(
      this.fieldColumn.column.nullable ? props.isRequired : true,
    );
    this.fieldValueHolder = new DataFormFieldInputValueHolder(
      this.key,
      this.isRequired,
    );
    this.inputComponentAndProps = derived(this.styling, (styling) => {
      if (this.fieldColumn.foreignKeyLink) {
        return getLinkedRecordInputCap({
          recordSelectionOrchestratorFactory: makeRowSeekerOrchestratorFactory({
            constructRecordStore: () =>
              new AsyncRpcApiStore(api.forms.list_related_records, {
                staticProps: {
                  form_token: this.getFormToken(),
                  field_key: this.key,
                },
              }),
          }),
        });
      }
      let { cellInfo } = this.fieldColumn.abstractType;
      if (cellInfo.type === 'string') {
        cellInfo = {
          type: 'string',
          config: { multiLine: styling?.size === 'large' },
        };
      }
      return getDbTypeBasedInputCap(this.fieldColumn.column, cellInfo);
    });
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
