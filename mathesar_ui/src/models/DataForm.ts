import { type Readable, derived, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type {
  RawDataForm,
  RawDataFormStructure,
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

  private _token;

  get token(): Readable<string> {
    return this._token;
  }

  private _sharePreferences;

  get sharePreferences(): Readable<{
    isPublishedPublicly: RawDataForm['publish_public'];
  }> {
    return this._sharePreferences;
  }

  private _structure;

  get structure(): Readable<RawDataFormStructure> {
    return this._structure;
  }

  constructor(props: { schema: Schema; rawDataForm: RawDataForm }) {
    this.schema = props.schema;
    this.id = props.rawDataForm.id;
    this.baseTableOId = props.rawDataForm.base_table_oid;
    this._name = writable(props.rawDataForm.name);
    this._description = writable(props.rawDataForm.description);
    this._token = writable(props.rawDataForm.token);
    this._sharePreferences = writable({
      isPublishedPublicly: props.rawDataForm.publish_public,
    });
    this._structure = writable({
      associated_role_id: props.rawDataForm.associated_role_id,
      header_title: props.rawDataForm.header_title,
      header_subtitle: props.rawDataForm.header_subtitle,
      fields: props.rawDataForm.fields,
      submit_message: props.rawDataForm.submit_message,
      submit_redirect_url: props.rawDataForm.submit_redirect_url,
      submit_button_label: props.rawDataForm.submit_button_label,
    });
  }

  // TODO_FORMS: Have a separate RPC method for this
  // Updating name & desc should not validate the entire form w.r.t associated_role
  // & shouldn't replace fields
  updateNameAndDesc(name: string, description: string | null) {
    const dataFormDef = get(this.toRawDataFormStore());
    const promise = api.forms
      .replace({
        new_form: {
          ...dataFormDef,
          id: this.id,
          name,
          description,
        },
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((rawDataForm) => {
            this._name.set(rawDataForm.name);
            this._description.set(rawDataForm.description);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  updateStructure(
    dataFormStructure: RawDataFormStructure,
  ): CancellablePromise<DataForm> {
    const dataFormDef = get(this.toRawDataFormStore());

    const promise = api.forms
      .replace({
        new_form: {
          ...dataFormDef,
          ...dataFormStructure,
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
            this._token.set(rawDataForm.token);
            this._sharePreferences.set({
              isPublishedPublicly: rawDataForm.publish_public,
            });
            this._structure.set({
              associated_role_id: rawDataForm.associated_role_id,
              header_title: rawDataForm.header_title,
              header_subtitle: rawDataForm.header_subtitle,
              fields: rawDataForm.fields,
              submit_message: rawDataForm.submit_message,
              submit_redirect_url: rawDataForm.submit_redirect_url,
              submit_button_label: rawDataForm.submit_button_label,
            });
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  updateSharingPreferences(sharePublicly: boolean) {
    // TODO_FORMS: Update this after we have a sharing RPC method
    const promise = Promise.resolve();

    return new CancellablePromise((resolve, reject) => {
      promise
        .then(() => {
          this._sharePreferences.set({
            isPublishedPublicly: sharePublicly,
          });
          return resolve(this);
        }, reject)
        .catch(reject);
    });
  }

  delete(): CancellablePromise<void> {
    return api.forms.delete({ form_id: this.id }).run();
  }

  toRawDataFormStore(): Readable<RawDataForm> {
    return derived(
      [
        this.token,
        this.name,
        this.description,
        this.structure,
        this.sharePreferences,
      ],
      ([$token, $name, $description, $structure, $sharePreferences]) => ({
        id: this.id,
        token: $token,
        version: 1,
        database_id: this.schema.database.id,
        base_table_oid: this.baseTableOId,
        schema_oid: this.schema.oid,
        name: $name,
        description: $description,
        ...$structure,
        publish_public: $sharePreferences.isPublishedPublicly,
      }),
    );
  }
}
