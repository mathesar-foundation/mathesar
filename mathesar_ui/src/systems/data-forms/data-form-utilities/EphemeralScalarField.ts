import { derived } from 'svelte/store';

import type {
  RawEphemeralScalarDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';

import { AbstractEphemeralField } from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';
import type { FormFields } from './FormFields';
import type { EphemeralScalarFieldProps } from './types';

export class EphermeralScalarField extends AbstractEphemeralField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  readonly fieldColumn;

  readonly fieldStore: FieldStore;

  readonly inputComponentAndProps;

  constructor(holder: FormFields, props: EphemeralScalarFieldProps) {
    super(holder, props);
    this.fieldColumn = props.fieldColumn;
    this.fieldStore = optionalField(null);
    this.inputComponentAndProps = derived(this.styling, (styling) =>
      this.fieldColumn.getInputComponentAndProps(styling),
    );
  }

  hasColumn(fieldColumn: FieldColumn) {
    return (
      this.fieldColumn.tableOid === fieldColumn.tableOid &&
      this.fieldColumn.column.id === fieldColumn.column.id
    );
  }

  toRawEphemeralField(): RawEphemeralScalarDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'scalar_column',
      column_attnum: this.fieldColumn.column.id,
    };
  }
}
