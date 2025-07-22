import { derived } from 'svelte/store';

import type {
  RawEphemeralScalarDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';

export class EphermeralScalarField extends AbstractEphemeralField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  readonly fieldColumn;

  readonly fieldStore: FieldStore;

  readonly inputComponentAndProps;

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & { fieldColumn: FieldColumn },
  ) {
    super(parentField, data);
    this.fieldColumn = data.fieldColumn;
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

  isConceptuallyEqual(dataFormField: EphemeralDataFormField) {
    return (
      dataFormField.kind === this.kind &&
      this.hasColumn(dataFormField.fieldColumn)
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
