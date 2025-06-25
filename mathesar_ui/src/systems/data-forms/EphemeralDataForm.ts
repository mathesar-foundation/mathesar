/* eslint-disable max-classes-per-file */

import type {
  RawDataForm,
  RawDataFormBaseField,
  RawDataFormField,
  RawForeignKeyDataFormField,
  RawReverseForeignKeyDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/data_forms';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';

export interface EdfUpdateDiff {
  data: EphemeralDataForm;
  change: keyof EphemeralDataForm;
}

export abstract class EphemeralField {
  readonly id: string;

  readonly path: string[];

  readonly parent: EphemeralField | EphemeralDataForm;

  readonly form: EphemeralDataForm;

  readonly key: RawDataFormBaseField['key'];

  readonly label: RawDataFormBaseField['label'];

  readonly help: RawDataFormBaseField['help'];

  readonly index: RawDataFormBaseField['index'];

  constructor(
    parent: EphemeralDataFormField | EphemeralDataForm,
    data: EphemeralDataFormField | RawDataFormField,
  ) {
    this.id = String(data.id);
    this.parent = parent;
    this.index = data.index;
    this.key = data.key;
    this.label = data.label;
    this.help = data.help;
    if ('path' in parent) {
      this.path = [...parent.path, this.id];
      this.form = parent.form;
    } else {
      this.path = [this.id];
      this.form = parent;
    }
  }
}

export class EphermeralScalarField extends EphemeralField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';
}

export class EphermeralFkField extends EphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly nested_fields: EphemeralDataFormField[] = [];
}

export class EphemeralReverseFkField extends EphemeralField {
  readonly kind: RawReverseForeignKeyDataFormField['kind'] =
    'reverse_foreign_key';

  readonly nested_fields: EphemeralDataFormField[] = [];
}

type EphemeralDataFormField =
  | EphermeralScalarField
  | EphermeralFkField
  | EphemeralReverseFkField;

export class EphemeralDataForm {
  readonly base_table_oid: RawDataForm['base_table_oid'];

  readonly name: RawDataForm['name'];

  readonly description: RawDataForm['description'];

  readonly associated_role: RawDataForm['associated_role'];

  readonly fields: EphemeralDataFormField[];

  constructor(edf: {
    base_table_oid: RawDataForm['base_table_oid'];
    name: RawDataForm['name'];
    description: RawDataForm['description'];
    associated_role: RawDataForm['associated_role'];
    fields: EphemeralDataFormField[];
  }) {
    this.base_table_oid = edf.base_table_oid;
    this.name = edf.name;
    this.description = edf.description;
    this.associated_role = edf.associated_role;
    this.fields = edf.fields;
  }

  withFields(fields: (EphemeralDataFormField | RawDataFormField)[]) {
    //
  }

  addColumnAsFiled(column: ProcessedColumn) {
    //
  }

  persist() {
    // should save and return DataForm
  }

  static fromTable(tableStructureSubstance: TableStructureSubstance) {
    return new EphemeralDataForm({
      base_table_oid: tableStructureSubstance.table.oid,
      name: tableStructureSubstance.table.name,
      description: null,
      associated_role: null,
      fields: [],
    });
  }
}

/* eslint-enable max-classes-per-file */
