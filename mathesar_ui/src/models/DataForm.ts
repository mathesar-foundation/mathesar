import { type Readable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  RawDataForm,
  RawEphemeralDataForm,
} from '@mathesar/api/rpc/forms';
import { CancellablePromise } from '@mathesar-component-library';

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

  private _accessRoleId;

  get accessRoleId(): Readable<RawDataForm['access_role_id']> {
    return this._accessRoleId;
  }

  private _token;

  get token(): Readable<string> {
    return this._token;
  }

  readonly _shareSettings;

  get shareSettings(): Readable<{
    isSharedPublicly: RawDataForm['share_public'];
  }> {
    return this._shareSettings;
  }

  private _formDefinition;

  get formDefinition(): Readable<{
    version: number;
    headerTitle: RawDataForm['header_title'];
    headerSubtitle: RawDataForm['header_subtitle'];
    fields: RawDataForm['fields'];
    submissionSettings: {
      message?: RawDataForm['submit_message'];
      redirectUrl?: RawDataForm['submit_redirect_url'];
      buttonLabel?: RawDataForm['submit_button_label'];
    };
  }> {
    return this._formDefinition;
  }

  constructor(props: { schema: Schema; rawDataForm: RawDataForm }) {
    this.schema = props.schema;
    this.id = props.rawDataForm.id;
    this.baseTableOId = props.rawDataForm.base_table_oid;
    this._name = writable(props.rawDataForm.name);
    this._description = writable(props.rawDataForm.description);
    this._accessRoleId = writable(props.rawDataForm.access_role_id);
    this._token = writable(props.rawDataForm.token);
    this._shareSettings = writable({
      isSharedPublicly: props.rawDataForm.share_public,
    });
    this._formDefinition = writable({
      version: props.rawDataForm.version,
      headerTitle: props.rawDataForm.header_title,
      headerSubtitle: props.rawDataForm.header_subtitle,
      fields: props.rawDataForm.fields,
      submissionSettings: {
        message: props.rawDataForm.submit_message,
        redirectUrl: props.rawDataForm.submit_redirect_url,
        buttonLabel: props.rawDataForm.submit_button_label,
      },
    });
  }

  replaceDataForm(
    dataFormDef: RawEphemeralDataForm,
  ): CancellablePromise<DataForm> {
    const promise = api.forms
      .replace({
        new_form: {
          ...dataFormDef,
          id: this.id,
        },
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((rawDataForm) => {
            this._name.set(rawDataForm.name);
            this._description.set(rawDataForm.description);
            this._accessRoleId.set(rawDataForm.access_role_id);
            this._token.set(rawDataForm.token);
            this._shareSettings.set({
              isSharedPublicly: rawDataForm.share_public,
            });
            this._formDefinition.set({
              version: rawDataForm.version,
              headerTitle: rawDataForm.header_title,
              headerSubtitle: rawDataForm.header_subtitle,
              fields: rawDataForm.fields,
              submissionSettings: {
                message: rawDataForm.submit_message,
                redirectUrl: rawDataForm.submit_redirect_url,
                buttonLabel: rawDataForm.submit_button_label,
              },
            });
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  toRawDataForm(): RawDataForm {
    const formDefinition = get(this.formDefinition);

    return {
      id: this.id,
      token: get(this.token),
      version: 1,
      database_id: this.schema.database.id,
      base_table_oid: this.baseTableOId,
      schema_oid: this.schema.oid,
      name: get(this.name),
      description: get(this.description),
      header_title: formDefinition.headerTitle,
      header_subtitle: formDefinition.headerSubtitle,
      fields: formDefinition.fields,
      access_role_id: get(this.accessRoleId),
      submit_message: formDefinition.submissionSettings.message,
      submit_redirect_url: formDefinition.submissionSettings.redirectUrl,
      submit_button_label: formDefinition.submissionSettings.buttonLabel,
      share_public: get(this.shareSettings).isSharedPublicly,
    };
  }
}
