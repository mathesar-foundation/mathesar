import { type Readable, derived, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import {
  type RawDataForm,
  type RawDataFormStructure,
  constructRequestToUpdateForm,
  dataFormStructureVersion,
} from '@mathesar/api/rpc/forms';
import { CancellablePromise } from '@mathesar-component-library';

import type { Schema } from './Schema';

export class DataForm {
  readonly schema: Schema;

  readonly id: number;

  readonly baseTableOid: number;

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
    this.baseTableOid = props.rawDataForm.base_table_oid;
    this._token = writable(props.rawDataForm.token);
    this._sharePreferences = writable({
      isPublishedPublicly: props.rawDataForm.publish_public,
    });
    this._structure = writable({
      name: props.rawDataForm.name,
      description: props.rawDataForm.description,
      associated_role_id: props.rawDataForm.associated_role_id,
      fields: props.rawDataForm.fields,
      submit_message: props.rawDataForm.submit_message,
      submit_redirect_url: props.rawDataForm.submit_redirect_url,
      submit_button_label: props.rawDataForm.submit_button_label,
    });
  }

  updateStructure(
    dataFormStructure: RawDataFormStructure,
  ): CancellablePromise<DataForm> {
    const promise = api.forms
      .patch(
        constructRequestToUpdateForm({
          ...dataFormStructure,
          id: this.id,
        }),
      )
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((rawDataForm) => {
            this._structure.set({
              name: rawDataForm.name,
              description: rawDataForm.description,
              associated_role_id: rawDataForm.associated_role_id,
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

  updateNameAndDesc(name: string, description: string | null) {
    const structure = get(this.structure);
    return this.updateStructure({
      ...structure,
      name,
      description,
    });
  }

  updateSharingPreferences(sharePublicly: boolean) {
    const promise = api.forms
      .set_publish_public({ form_id: this.id, publish_public: sharePublicly })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((res) => {
            this._sharePreferences.set({
              isPublishedPublicly: res,
            });
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  regenerateToken() {
    const promise = api.forms.regenerate_token({ form_id: this.id }).run();
    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((token) => {
            this._token.set(token);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  delete(): CancellablePromise<void> {
    return api.forms.delete({ form_id: this.id }).run();
  }

  toRawDataFormStore(): Readable<RawDataForm> {
    return derived(
      [this.token, this.structure, this.sharePreferences],
      ([$token, $structure, $sharePreferences]) => ({
        id: this.id,
        token: $token,
        version: dataFormStructureVersion,
        database_id: this.schema.database.id,
        base_table_oid: this.baseTableOid,
        schema_oid: this.schema.oid,
        ...$structure,
        publish_public: $sharePreferences.isPublishedPublicly,
      }),
    );
  }
}
