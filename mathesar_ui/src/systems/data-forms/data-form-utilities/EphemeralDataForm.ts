import { type Readable, type Writable, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormGetResponse,
  RawEphemeralDataForm,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { type ImmutableMap, WritableMap } from '@mathesar-component-library';

import type { EphemeralDataFormField } from './AbstractEphemeralField';
import {
  rawEphemeralFieldToEphemeralField,
  tableStructureSubstanceToEphemeralFields,
} from './transformers';

export interface EdfUpdateDiff {
  change: keyof EphemeralDataForm;
}

export class EphemeralDataForm {
  readonly baseTableOid;

  readonly schemaOid;

  readonly databaseId;

  private _name;

  get name(): Readable<RawDataForm['name']> {
    return this._name;
  }

  private _description;

  get description(): Readable<RawDataForm['description']> {
    return this._description;
  }

  private _accessRoleId;

  get accessRoleId(): Readable<RawDataForm['access_role_id']> {
    return this._accessRoleId;
  }

  private _fields;

  get fields(): Readable<
    ImmutableMap<EphemeralDataFormField['key'], EphemeralDataFormField>
  > {
    return this._fields;
  }

  constructor(edf: {
    baseTableOid: number;
    schemaOid: number;
    databaseId: number;
    name: Writable<RawDataForm['name']>;
    description: Writable<RawDataForm['description']>;
    accessRoleId: Writable<RawDataForm['access_role_id']>;
    fields: WritableMap<EphemeralDataFormField['key'], EphemeralDataFormField>;
  }) {
    this.baseTableOid = edf.baseTableOid;
    this.schemaOid = edf.schemaOid;
    this.databaseId = edf.databaseId;
    this._name = edf.name;
    this._description = edf.description;
    this._accessRoleId = edf.accessRoleId;
    this._fields = edf.fields;
  }

  setName(name: string): EdfUpdateDiff {
    this._name.set(name);
    return {
      change: 'name',
    };
  }

  setDescription(description: string): EdfUpdateDiff {
    this._description.set(description);
    return {
      change: 'description',
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
      access_role_id: get(this.accessRoleId),
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
      accessRoleId: writable(rawEphemeralDataForm.access_role_id),
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
      accessRoleId: writable(null),
      fields: new WritableMap(
        tableStructureSubstanceToEphemeralFields(
          tableStructureSubstance,
          null,
        ).map((ef) => [ef.key, ef]),
      ),
    });
  }
}
