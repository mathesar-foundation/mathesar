import type { RawDataForm } from '@mathesar/api/rpc/data_forms';

export interface EdfUpdateDiff {
  data: EphemeralDataForm;
  change: keyof EphemeralDataFormInterface;
}

type EphemeralDataFormInterface = Partial<
  Pick<
    RawDataForm,
    'base_table_oid' | 'name' | 'description' | 'associated_role' | 'fields'
  >
>;

export class EphemeralDataForm implements EphemeralDataFormInterface {
  base_table_oid?: RawDataForm['base_table_oid'];

  name?: RawDataForm['name'];

  description?: RawDataForm['description'];

  associated_role?: RawDataForm['associated_role'];

  fields?: RawDataForm['fields'];

  constructor(edf: EphemeralDataFormInterface) {
    this.base_table_oid = edf.base_table_oid;
    this.name = edf.name;
    this.description = edf.description;
    this.associated_role = edf.associated_role;
    this.fields = edf.fields;
  }

  withBaseTable(base_table_oid?: number): EdfUpdateDiff {
    return {
      data: new EphemeralDataForm({
        base_table_oid,
        name: this.name,
        description: this.description,
        associated_role: this.associated_role,
        fields: this.fields,
      }),
      change: 'base_table_oid',
    };
  }

  persist() {
    // should save and return DataForm
  }

  static fromDataForm() {
    // should receieve DataForm and return EphemeralDataForm
  }
}
