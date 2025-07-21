import { type Readable, type Writable, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormSource,
  RawEphemeralDataForm,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';

import type { EphemeralDataFormField } from './AbstractEphemeralField';
import { FormFields } from './FormFields';
import {
  rawEphemeralFieldToEphemeralField,
  tableStructureSubstanceToEphemeralFields,
} from './transformers';

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

  private _headerTitle;

  get headerTitle(): Readable<RawDataForm['header_title']> {
    return this._headerTitle;
  }

  private _headerSubTitle;

  get headerSubTitle(): Readable<RawDataForm['header_subtitle']> {
    return this._headerSubTitle;
  }

  private _associatedRoleId;

  get associatedRoleId(): Readable<RawDataForm['associated_role_id']> {
    return this._associatedRoleId;
  }

  fields: FormFields;

  constructor(edf: {
    baseTableOid: number;
    schemaOid: number;
    databaseId: number;
    name: Writable<RawDataForm['name']>;
    description: Writable<RawDataForm['description']>;
    headerTitle: Writable<RawDataForm['header_title']>;
    headerSubTitle: Writable<RawDataForm['header_subtitle']>;
    associatedRoleId: Writable<RawDataForm['associated_role_id']>;
    fields: Iterable<EphemeralDataFormField>;
  }) {
    this.baseTableOid = edf.baseTableOid;
    this.schemaOid = edf.schemaOid;
    this.databaseId = edf.databaseId;
    this._name = edf.name;
    this._description = edf.description;
    this._headerTitle = edf.headerTitle;
    this._headerSubTitle = edf.headerSubTitle;
    this._associatedRoleId = edf.associatedRoleId;
    this.fields = new FormFields(edf.fields);
  }

  setName(name: string) {
    this._name.set(name);
  }

  setDescription(description: string) {
    this._description.set(description);
  }

  setHeaderTitle(title: string) {
    this._headerTitle.set({
      text: title,
    });
  }

  setHeaderSubTitle(subTitle: string) {
    this._headerSubTitle.set({
      text: subTitle,
    });
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
      header_subtitle: get(this.headerSubTitle),
      fields: [...get(this.fields).values()].map((field) =>
        field.toRawEphemeralField(),
      ),
    };
  }

  static fromRawEphemeralDataForm(
    rawEphemeralDataForm: RawEphemeralDataForm,
    formSource: RawDataFormSource,
  ) {
    return new EphemeralDataForm({
      baseTableOid: rawEphemeralDataForm.base_table_oid,
      schemaOid: rawEphemeralDataForm.schema_oid,
      databaseId: rawEphemeralDataForm.database_id,
      name: writable(rawEphemeralDataForm.name),
      description: writable(rawEphemeralDataForm.description),
      headerTitle: writable(rawEphemeralDataForm.header_title),
      headerSubTitle: writable(rawEphemeralDataForm.header_subtitle),
      associatedRoleId: writable(rawEphemeralDataForm.associated_role_id),
      fields: rawEphemeralDataForm.fields.map((field) =>
        rawEphemeralFieldToEphemeralField(
          field,
          null,
          rawEphemeralDataForm.base_table_oid,
          formSource,
        ),
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
      headerTitle: writable({
        text: tableStructureSubstance.table.name,
      }),
      headerSubTitle: writable(null),
      associatedRoleId: writable(null),
      fields: tableStructureSubstanceToEphemeralFields(
        tableStructureSubstance,
        null,
      ),
    });
  }
}
