import { type Readable, get, writable } from 'svelte/store';

import type { RawDataForm, RawDataFormField } from '@mathesar/api/rpc/forms';

import type { Schema } from './Schema';

export class DataForm {
  readonly schema: Schema;

  readonly id: number;

  readonly baseTableOId: number;

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

  private _submissionSettings;

  get submissionSettings(): Readable<{
    message?: RawDataForm['submit_message'];
    redirectUrl?: RawDataForm['submit_redirect_url'];
    buttonLabel?: RawDataForm['submit_button_label'];
  }> {
    return this._submissionSettings;
  }

  private _token;

  get token(): Readable<string> {
    return this._token;
  }

  readonly _fields;

  get fields(): Readable<RawDataFormField[]> {
    return this._fields;
  }

  readonly _shareSettings;

  get shareSettings(): Readable<{
    isSharedPublicly: RawDataForm['share_public'];
  }> {
    return this._shareSettings;
  }

  constructor(props: { schema: Schema; rawDataForm: RawDataForm }) {
    this.schema = props.schema;
    this.id = props.rawDataForm.id;
    this.baseTableOId = props.rawDataForm.base_table_oid;
    this._name = writable(props.rawDataForm.name);
    this._description = writable(props.rawDataForm.description);
    this._headerTitle = writable(props.rawDataForm.header_title);
    this._headerSubTitle = writable(props.rawDataForm.header_subtitle);
    this._associatedRoleId = writable(props.rawDataForm.associated_role_id);
    this._submissionSettings = writable({
      message: props.rawDataForm.submit_message,
      redirectUrl: props.rawDataForm.submit_redirect_url,
      buttonLabel: props.rawDataForm.submit_button_label,
    });
    this._fields = writable(props.rawDataForm.fields);
    this._token = writable(props.rawDataForm.token);
    this._shareSettings = writable({
      isSharedPublicly: props.rawDataForm.share_public,
    });
  }

  toRawDataForm(): RawDataForm {
    const submissionSettings = get(this.submissionSettings);

    return {
      id: this.id,
      token: get(this.token),
      version: 1,
      database_id: this.schema.database.id,
      base_table_oid: this.baseTableOId,
      schema_oid: this.schema.oid,
      name: get(this.name),
      description: get(this.description),
      header_title: get(this.headerTitle),
      header_subtitle: get(this.headerSubTitle),
      fields: get(this.fields),
      associated_role_id: get(this.associatedRoleId),
      submit_message: submissionSettings.message,
      submit_redirect_url: submissionSettings.redirectUrl,
      submit_button_label: submissionSettings.buttonLabel,
      share_public: get(this.shareSettings).isSharedPublicly,
    };
  }
}
