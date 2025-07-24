import { type Readable, derived, get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  getDbTypeBasedInputCap,
  getLinkedRecordInputCap,
} from '@mathesar/components/cell-fabric/utils';
import {
  type FieldStore,
  optionalField,
  requiredField,
} from '@mathesar/components/form';
import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';

import { AbstractEphemeralField } from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';
import type { FormFields } from './FormFields';
import type { AbstractEphemeralColumnBasedFieldProps } from './types';

export abstract class AbstractEphermeralColumnBasedField extends AbstractEphemeralField {
  readonly fieldColumn;

  readonly fieldStore: Readable<FieldStore>;

  readonly inputComponentAndProps;

  private _isRequired;

  get isRequired(): Readable<
    AbstractEphemeralColumnBasedFieldProps['isRequired']
  > {
    return this._isRequired;
  }

  constructor(
    holder: FormFields,
    props: AbstractEphemeralColumnBasedFieldProps,
  ) {
    super(holder, props);
    this.fieldColumn = props.fieldColumn;
    this._isRequired = writable(
      this.fieldColumn.column.nullable ? props.isRequired : true,
    );
    this.fieldStore = derived(this.isRequired, ($isRequired) =>
      $isRequired ? requiredField(undefined) : optionalField(undefined),
    );
    this.inputComponentAndProps = derived(this.styling, (styling) => {
      if (this.fieldColumn.foreignKeyLink) {
        return getLinkedRecordInputCap({
          recordSelectionOrchestratorFactory: makeRowSeekerOrchestratorFactory({
            formToken: this.getFormToken(),
            fieldKey: this.key,
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
    this.bubblePropChange('isRequired');
  }

  hasColumn(fieldColumn: FieldColumn) {
    return (
      this.fieldColumn.tableOid === fieldColumn.tableOid &&
      this.fieldColumn.column.id === fieldColumn.column.id
    );
  }

  protected getBaseFieldRawJson() {
    return {
      ...super.getBaseFieldRawJson(),
      column_attnum: this.fieldColumn.column.id,
      is_required: get(this.isRequired),
    };
  }
}
