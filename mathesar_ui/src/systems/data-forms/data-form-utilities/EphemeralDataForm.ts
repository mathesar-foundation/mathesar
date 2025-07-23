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

  private _submitMessage;

  get submitMessage(): Readable<RawDataForm['submit_message']> {
    return this._submitMessage;
  }

  private _submitRedirectUrl;

  get submitRedirectUrl(): Readable<RawDataForm['submit_redirect_url']> {
    return this._submitRedirectUrl;
  }

  private _submitButtonLabel;

  get submitButtonLabel(): Readable<RawDataForm['submit_button_label']> {
    return this._submitButtonLabel;
  }

  fields: FormFields;

  constructor(edf: {
    baseTableOid: number;
    schemaOid: number;
    databaseId: number;
    name: RawDataForm['name'];
    description: RawDataForm['description'];
    headerTitle: RawDataForm['header_title'];
    headerSubTitle: RawDataForm['header_subtitle'];
    associatedRoleId: RawDataForm['associated_role_id'];
    submitMessage: RawDataForm['submit_message'];
    submitRedirectUrl: RawDataForm['submit_redirect_url'];
    submitButtonLabel: RawDataForm['submit_button_label'];
    fields: Iterable<EphemeralDataFormField>;
  }) {
    this.baseTableOid = edf.baseTableOid;
    this.schemaOid = edf.schemaOid;
    this.databaseId = edf.databaseId;
    this._name = writable(edf.name);
    this._description = writable(edf.description);
    this._headerTitle = writable(edf.headerTitle);
    this._headerSubTitle = writable(edf.headerSubTitle);
    this._associatedRoleId = writable(edf.associatedRoleId);
    this._submitMessage = writable(edf.submitMessage);
    this._submitRedirectUrl = writable(edf.submitRedirectUrl);
    this._submitButtonLabel = writable(edf.submitButtonLabel);
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

  setAssociatedRoleId(configuredRoleId: number | null) {
    this._associatedRoleId.set(configuredRoleId);
  }

  setSubmissionMessage(message: string | null) {
    this._submitMessage.update((settings) =>
      message
        ? {
            text: message,
          }
        : null,
    );
  }

  setSubmissionRedirectUrl(url: string | null) {
    this._submitRedirectUrl.set(url);
  }

  setSubmissionButtonLabel(label: string | null) {
    this._submitButtonLabel.set(label);
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
      name: rawEphemeralDataForm.name,
      description: rawEphemeralDataForm.description,
      headerTitle: rawEphemeralDataForm.header_title,
      headerSubTitle: rawEphemeralDataForm.header_subtitle,
      associatedRoleId: rawEphemeralDataForm.associated_role_id,
      submitMessage: rawEphemeralDataForm.submit_message,
      submitRedirectUrl: rawEphemeralDataForm.submit_redirect_url,
      submitButtonLabel: rawEphemeralDataForm.submit_button_label,
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
      name: tableStructureSubstance.table.name,
      description: null,
      headerTitle: {
        text: tableStructureSubstance.table.name,
      },
      headerSubTitle: null,
      associatedRoleId: null,
      submitMessage: null,
      submitRedirectUrl: null,
      submitButtonLabel: null,
      fields: tableStructureSubstanceToEphemeralFields(
        tableStructureSubstance,
        null,
      ),
    });
  }
}
