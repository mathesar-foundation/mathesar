import { type Readable, derived, get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { AbstractEphemeralField } from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';
import { DataFormFieldInputValueHolder } from './FieldValueHolder';
import type { FormFields } from './FormFields';
import type { AbstractEphemeralColumnBasedFieldProps } from './types';

export abstract class AbstractEphermeralColumnBasedField extends AbstractEphemeralField {
  readonly fieldColumn;

  readonly fieldValueHolder: DataFormFieldInputValueHolder;

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
    this.fieldValueHolder = new DataFormFieldInputValueHolder(
      this.key,
      this.isRequired,
    );
    this.inputComponentAndProps = derived(this.styling, (styling) =>
      this.fieldColumn.getInputComponentAndProps(styling),
    );
    // Form token and key are accessible here
    // console.log(this.getFormToken(), this.key);
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
