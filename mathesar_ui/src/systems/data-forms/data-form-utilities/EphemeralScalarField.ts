import type {
  RawEphemeralScalarDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';

export class EphermeralScalarField extends AbstractEphemeralField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  readonly processedColumn;

  readonly fieldStore: FieldStore;

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & { processedColumn: ProcessedColumn },
  ) {
    super(parentField, data);
    this.processedColumn = data.processedColumn;
    this.fieldStore = optionalField(null);
  }

  hasSource(processedColumn: ProcessedColumn) {
    return (
      this.processedColumn.tableOid === processedColumn.tableOid &&
      this.processedColumn.id === processedColumn.id
    );
  }

  isConceptuallyEqual(dataFormField: EphemeralDataFormField) {
    return (
      dataFormField.kind === this.kind &&
      this.hasSource(dataFormField.processedColumn)
    );
  }

  toRawEphemeralField(): RawEphemeralScalarDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'scalar_column',
      column_attnum: this.processedColumn.id,
    };
  }
}
