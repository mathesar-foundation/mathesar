import { type Writable, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormGetResponse,
  RawEphemeralDataForm,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { WritableMap } from '@mathesar-component-library';

import type { EphemeralDataFormField } from './AbstractEphemeralField';
import {
  columnToEphemeralField,
  rawEphemeralFieldToEphemeralField,
} from './transformers';

export interface EdfUpdateDiff {
  change: keyof EphemeralDataForm;
}

export class EphemeralDataForm {
  readonly baseTableOid;

  readonly schemaOid;

  readonly databaseId;

  readonly name;

  readonly description;

  readonly associatedRoleId;

  readonly fields;

  constructor(edf: {
    baseTableOid: number;
    schemaOid: number;
    databaseId: number;
    name: Writable<RawDataForm['name']>;
    description: Writable<RawDataForm['description']>;
    associatedRoleId: Writable<RawDataForm['associated_role_id']>;
    fields: WritableMap<EphemeralDataFormField['key'], EphemeralDataFormField>;
  }) {
    this.baseTableOid = edf.baseTableOid;
    this.schemaOid = edf.schemaOid;
    this.databaseId = edf.databaseId;
    this.name = edf.name;
    this.description = edf.description;
    this.associatedRoleId = edf.associatedRoleId;
    this.fields = edf.fields;
  }

  setName(name: string): EdfUpdateDiff {
    this.name.set(name);
    return {
      change: 'name',
    };
  }

  toRawEphemeralDataForm(): RawEphemeralDataForm {
    return {
      database_id: this.databaseId,
      base_table_oid: this.baseTableOid,
      schema_oid: this.schemaOid,
      name: get(this.name),
      description: get(this.description),
      version: 1,
      associated_role_id: get(this.associatedRoleId),
      header_title: {
        text: get(this.name),
      },
      header_subtitle: {
        text: get(this.description) ?? '',
      },
      fields: [...get(this.fields).values()].map((field) =>
        field.toRawEphemeralField(),
      ),
    };
  }

  static fromRawEphemeralDataForm(
    rawEphemeralDataForm: RawEphemeralDataForm,
    formSource: RawDataFormGetResponse['field_col_info_map'],
  ) {
    return new EphemeralDataForm({
      baseTableOid: rawEphemeralDataForm.base_table_oid,
      schemaOid: rawEphemeralDataForm.schema_oid,
      databaseId: rawEphemeralDataForm.database_id,
      name: writable(rawEphemeralDataForm.name),
      description: writable(rawEphemeralDataForm.description),
      associatedRoleId: writable(rawEphemeralDataForm.associated_role_id),
      fields: new WritableMap(
        rawEphemeralDataForm.fields.map((field) => {
          const ef = rawEphemeralFieldToEphemeralField(
            field,
            null,
            rawEphemeralDataForm.base_table_oid,
            formSource,
          );
          return [ef.key, ef];
        }),
      ),
    });
  }

  static fromTable(tableStructureSubstance: TableStructureSubstance) {
    return new EphemeralDataForm({
      baseTableOid: tableStructureSubstance.table.oid,
      schemaOid: tableStructureSubstance.table.schema.oid,
      databaseId: tableStructureSubstance.table.schema.database.id,
      name: writable(tableStructureSubstance.table.name),
      description: writable(null),
      associatedRoleId: writable(null),
      fields: new WritableMap(
        [...tableStructureSubstance.processedColumns.values()]
          .filter((pc) => !pc.column.default?.is_dynamic)
          .map((c, index) => {
            const ef = columnToEphemeralField(
              c,
              tableStructureSubstance,
              null,
              index,
            );
            return [ef.key, ef];
          }),
      ),
    });
  }
}
