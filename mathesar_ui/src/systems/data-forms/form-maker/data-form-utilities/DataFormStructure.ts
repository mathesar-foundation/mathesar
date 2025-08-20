import { type Readable, derived, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormStructure,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, makeForm } from '@mathesar/components/form';
import type { RowSeekerProps } from '@mathesar/systems/row-seeker/RowSeekerController';
import { collapse } from '@mathesar-component-library';

import type { DataFormStructureChangeEventHandler } from './DataFormStructureChangeEventHandler';
import {
  type DataFormFieldContainerFactory,
  type DataFormFieldFkInputValueHolder,
  ErrorField,
  type FormFields,
  buildFormFieldContainerFactory,
  walkFormFields,
} from './fields';
import type { FormSource } from './FormSource';

interface DataFormStructureProps {
  baseTableOid: number;
  schemaOid: number;
  databaseId: number;
  name: RawDataForm['name'];
  description: RawDataForm['description'];
  associatedRoleId: RawDataForm['associated_role_id'];
  submitMessage: RawDataForm['submit_message'];
  submitRedirectUrl: RawDataForm['submit_redirect_url'];
  submitButtonLabel: RawDataForm['submit_button_label'];
  createFields: DataFormFieldContainerFactory;
}

export type DataFormPropChangeEvent = {
  type: 'form/prop';
  target: DataFormStructure;
  prop: keyof Pick<
    DataFormStructureProps,
    | 'name'
    | 'description'
    | 'associatedRoleId'
    | 'submitMessage'
    | 'submitRedirectUrl'
    | 'submitButtonLabel'
  >;
};

export interface DataFormStructureCtx {
  rowSeekerRecordStoreConstructor: (props: {
    key: string;
    relatedTableOid: number;
    tableOid: number;
    columnAttnum: number;
  }) => RowSeekerProps['constructRecordStore'];
  changeEventHandler?: DataFormStructureChangeEventHandler;
}

export type DataFormStructureFactory = (
  props: DataFormStructureCtx,
) => DataFormStructure;

export class DataFormStructure {
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

  private structureCtx: DataFormStructureCtx;

  readonly formHolder;

  constructor(
    props: DataFormStructureProps,
    structureCtx: DataFormStructureCtx,
  ) {
    this.baseTableOid = props.baseTableOid;
    this.schemaOid = props.schemaOid;
    this.databaseId = props.databaseId;
    this._name = writable(props.name);
    this._description = writable(props.description);
    this._associatedRoleId = writable(props.associatedRoleId);
    this._submitMessage = writable(props.submitMessage);
    this._submitRedirectUrl = writable(props.submitRedirectUrl);
    this._submitButtonLabel = writable(props.submitButtonLabel);
    this.structureCtx = structureCtx;
    this.fields = props.createFields(this, this.structureCtx);
    this.formHolder = derived(
      this.fields.fieldValueStores,
      (_, set) => {
        let unsubValueStores: (() => void)[] = [];
        const { fieldValueStores } = this.fields;

        function update() {
          // Always get most recent data to avoid race conditions
          const fieldStores = get(fieldValueStores);
          const fieldObjs = [...fieldStores].reduce(
            (acc, curr) => {
              if (get(curr.includeFieldStoreInForm)) {
                acc[curr.key] = get(curr.inputFieldStore);
              }
              return acc;
            },
            {} as Record<string, FieldStore>,
          );
          set(makeForm(fieldObjs));
        }

        function resubscribe() {
          unsubValueStores.forEach((u) => u());
          unsubValueStores = [];
          const fieldStores = get(fieldValueStores);
          [...fieldStores.values()].forEach((item) => {
            unsubValueStores.push(item.inputFieldStore.subscribe(update));
            unsubValueStores.push(
              item.includeFieldStoreInForm.subscribe(update),
            );
          });
        }

        resubscribe();
        update();
        return () => unsubValueStores.forEach((u) => u());
      },
      makeForm({} as Record<string, FieldStore>),
    );
  }

  private triggerChangeEvent(prop: DataFormPropChangeEvent['prop']) {
    this.structureCtx.changeEventHandler?.trigger({
      type: 'form/prop',
      target: this,
      prop,
    });
  }

  setName(name: string) {
    this._name.set(name);
    this.triggerChangeEvent('name');
  }

  setDescription(desc: string) {
    this._description.set(desc);
    this.triggerChangeEvent('description');
  }

  setAssociatedRoleId(configuredRoleId: number | null) {
    this._associatedRoleId.set(configuredRoleId);
    this.triggerChangeEvent('associatedRoleId');
  }

  setSubmissionMessage(message: string | null) {
    this._submitMessage.set(
      message
        ? {
            text: message,
          }
        : null,
    );
    this.triggerChangeEvent('submitMessage');
  }

  setSubmissionRedirectUrl(url: string | null) {
    this._submitRedirectUrl.set(url);
    this.triggerChangeEvent('submitRedirectUrl');
  }

  setSubmissionButtonLabel(label: string | null) {
    this._submitButtonLabel.set(label);
    this.triggerChangeEvent('submitButtonLabel');
  }

  getFormSubmitRequest() {
    const form = get(collapse(this.formHolder));
    let request = {
      ...form.values,
    };
    const fieldValueStores = get(this.fields.fieldValueStores);
    const fkFieldValueStores = fieldValueStores.filter(
      (s): s is DataFormFieldFkInputValueHolder => 'userAction' in s,
    );
    fkFieldValueStores.forEach((s) => {
      const ua = get(s.userAction);
      const value = request[s.key];
      request = {
        ...request,
        [s.key]:
          ua === 'create'
            ? {
                type: ua,
              }
            : {
                type: ua,
                value: value ?? null,
              },
      };
    });
    return request;
  }

  hasErrorFields(): boolean {
    for (const field of walkFormFields(this.fields)) {
      if (field instanceof ErrorField) {
        return true;
      }
    }
    return false;
  }

  toRawStructure(options?: {
    withoutErrorFields: boolean;
  }): RawDataFormStructure {
    return {
      associated_role_id: get(this.associatedRoleId),
      name: get(this.name),
      description: get(this.description),
      fields: this.fields.toRawFields(options),
      submit_message: get(this.submitMessage),
      submit_redirect_url: get(this.submitRedirectUrl),
      submit_button_label: get(this.submitButtonLabel),
    };
  }

  static factoryFromRawInfo(
    props: RawDataFormStructure & {
      database_id: RawDataForm['database_id'];
      schema_oid: RawDataForm['schema_oid'];
      base_table_oid: RawDataForm['base_table_oid'];
    },
    formSource: FormSource,
  ): DataFormStructureFactory {
    return (structureCtx) =>
      new DataFormStructure(
        {
          baseTableOid: props.base_table_oid,
          schemaOid: props.schema_oid,
          databaseId: props.database_id,
          name: props.name,
          description: props.description,
          associatedRoleId: props.associated_role_id,
          submitMessage: props.submit_message,
          submitRedirectUrl: props.submit_redirect_url,
          submitButtonLabel: props.submit_button_label,
          createFields: buildFormFieldContainerFactory({
            parentTableOid: props.base_table_oid,
            rawDataFormFields: props.fields,
            formSource,
          }),
        },
        structureCtx,
      );
  }
}
