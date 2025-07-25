import { type Readable, derived, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawEphemeralDataForm,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, makeForm } from '@mathesar/components/form';

import { FormFields } from './FormFields';
import type {
  EdfChange,
  EdfDirectProps,
  EdfNestedFieldChanges,
  EphemeralDataFormProps,
} from './types';

export class EphemeralDataForm {
  readonly baseTableOid;

  readonly schemaOid;

  readonly databaseId;

  readonly token;

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

  readonly fields: FormFields;

  private onChange?: (e: EdfChange | EdfNestedFieldChanges) => unknown;

  readonly formHolder;

  constructor(
    edf: EphemeralDataFormProps,
    onChange?: (e: EdfChange | EdfNestedFieldChanges) => unknown,
  ) {
    this.baseTableOid = edf.baseTableOid;
    this.schemaOid = edf.schemaOid;
    this.databaseId = edf.databaseId;
    this.token = edf.token;
    this._name = writable(edf.name);
    this._description = writable(edf.description);
    this._headerTitle = writable(edf.headerTitle);
    this._headerSubTitle = writable(edf.headerSubTitle);
    this._associatedRoleId = writable(edf.associatedRoleId);
    this._submitMessage = writable(edf.submitMessage);
    this._submitRedirectUrl = writable(edf.submitRedirectUrl);
    this._submitButtonLabel = writable(edf.submitButtonLabel);
    this.onChange = onChange;
    this.fields = new FormFields(this, edf.fields, (e) => {
      if ('target' in e) {
        this.onChange?.(e);
        return;
      }
      this.onChange?.({
        target: this,
        prop: 'fields',
        detail: e,
      });
    });
    this.formHolder = derived(
      this.fields.fieldValueStores,
      ($fieldValueStores, set) => {
        let unsubValueStores: (() => void)[] = [];

        function update() {
          set(
            makeForm(
              [...$fieldValueStores.values()].reduce(
                (acc, curr) => {
                  acc[curr.key] = get(curr.inputFieldStore);
                  return acc;
                },
                {} as Record<string, FieldStore>,
              ),
            ),
          );
        }

        function resubscribe() {
          unsubValueStores.forEach((u) => u());
          unsubValueStores = [...$fieldValueStores.values()].map((item) =>
            item.inputFieldStore.subscribe(update),
          );
        }

        resubscribe();
        update();
        return () => unsubValueStores.forEach((u) => u());
      },
      makeForm({} as Record<string, FieldStore>),
    );
  }

  private bubblePropChange(prop: EdfDirectProps) {
    const change: EdfChange = {
      prop,
      target: this,
    };
    this.onChange?.(change);
  }

  setName(name: string) {
    this._name.set(name);
    this.bubblePropChange('name');
  }

  setDescription(description: string) {
    this._description.set(description);
    this.bubblePropChange('description');
  }

  setHeaderTitle(title: string) {
    this._headerTitle.set({
      text: title,
    });
    this.bubblePropChange('headerTitle');
  }

  setHeaderSubTitle(subTitle: string) {
    this._headerSubTitle.set({
      text: subTitle,
    });
    this.bubblePropChange('headerSubtitle');
  }

  setAssociatedRoleId(configuredRoleId: number | null) {
    this._associatedRoleId.set(configuredRoleId);
    this.bubblePropChange('associatedRoleId');
  }

  setSubmissionMessage(message: string | null) {
    this._submitMessage.set(
      message
        ? {
            text: message,
          }
        : null,
    );
    this.bubblePropChange('submitMessage');
  }

  setSubmissionRedirectUrl(url: string | null) {
    this._submitRedirectUrl.set(url);
    this.bubblePropChange('submitRedirectUrl');
  }

  setSubmissionButtonLabel(label: string | null) {
    this._submitButtonLabel.set(label);
    this.bubblePropChange('submitButtonLabel');
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
      header_title: get(this.headerTitle),
      header_subtitle: get(this.headerSubTitle),
      fields: [...get(this.fields).values()].map((field) =>
        field.toRawEphemeralField(),
      ),
      submit_message: get(this.submitMessage),
      submit_redirect_url: get(this.submitRedirectUrl),
      submit_button_label: get(this.submitButtonLabel),
    };
  }
}
