import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawColumnWithMetadata } from './columns';
import type { RawDatabase } from './databases';
import type { RawConfiguredRole } from './roles';
import type { RawTable } from './tables';

export interface RichTextJson {
  text: string;
}

export const fkFieldInteractionRules = [
  'must_pick',
  'can_pick_or_create',
  'must_create',
] as const;

export const dataFormStructureVersion = 1;

interface RawDataFormBaseField {
  key: string;
  index: number;
  label?: string | null;
  help?: string | null;
  styling?: {
    size?: 'regular' | 'large';
  } | null;
  is_required: boolean;
}

export interface RawScalarDataFormField extends RawDataFormBaseField {
  kind: 'scalar_column';
  column_attnum: number;
}

export interface RawForeignKeyDataFormField extends RawDataFormBaseField {
  kind: 'foreign_key';
  column_attnum: number;
  related_table_oid: number;
  fk_interaction_rule: (typeof fkFieldInteractionRules)[number];
  child_fields: RawDataFormField[] | null;
}

export type RawDataFormField =
  | RawScalarDataFormField
  | RawForeignKeyDataFormField;

export interface RawDataFormStructure {
  name: string;
  description: string | null;
  fields: RawDataFormField[];
  submit_message: RichTextJson | null;
  submit_redirect_url: string | null;
  submit_button_label: string | null;
  associated_role_id: RawConfiguredRole['id'] | null;
}

export interface RawEphemeralDataForm extends RawDataFormStructure {
  database_id: number;
  base_table_oid: number;
  schema_oid: number;
  version: number;
}

export interface RawDataForm extends RawEphemeralDataForm {
  id: number;
  token: string;
  publish_public: boolean;
}

interface AddRawDataFormRequest extends RawEphemeralDataForm {
  header_title: RichTextJson;
  header_subtitle: RichTextJson | null;
}

interface UpdateRawDataFormRequest extends RawDataFormStructure {
  id: number;
  version: number;
  header_title: RichTextJson;
  header_subtitle: RichTextJson | null;
}

interface RawDataFormResponse extends RawDataForm {
  created_at: string;
  updated_at: string;
}

export type RawDataFormSource = Record<
  string,
  {
    table_info: RawTable;
    columns: Record<string, RawColumnWithMetadata>;
  }
>;

/**
 * We have these constructRequest methods to add `header_title` & `header_subtitle` to requests.
 *
 * These properties are stored on the Form model on the backend. However, the frontend does not use them,
 * and instead uses the name & description directly.
 * See this comment: https://github.com/mathesar-foundation/mathesar/pull/4609#pullrequestreview-3079427817
 *
 * We have not removed them from the backend since we might want to separate them on the frontend in the future.
 */

export function constructRequestToAddForm(dataFormDef: RawEphemeralDataForm): {
  form_def: AddRawDataFormRequest;
} {
  return {
    form_def: {
      ...dataFormDef,
      header_title: { text: dataFormDef.name },
      header_subtitle: dataFormDef.description
        ? { text: dataFormDef.description }
        : null,
    },
  };
}

export function constructRequestToUpdateForm(
  updateFormDef: RawDataFormStructure & { id: number },
): { update_form_def: UpdateRawDataFormRequest } {
  return {
    update_form_def: {
      ...updateFormDef,
      version: dataFormStructureVersion,
      header_title: { text: updateFormDef.name },
      header_subtitle: updateFormDef.description
        ? { text: updateFormDef.description }
        : null,
    },
  };
}

export const forms = {
  get: rpcMethodTypeContainer<
    {
      form_token: RawDataForm['token'];
    },
    RawDataFormResponse
  >(),
  get_source_info: rpcMethodTypeContainer<
    {
      form_token: RawDataForm['token'];
    },
    RawDataFormSource
  >(),
  list: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      schema_oid: RawDataForm['schema_oid'];
    },
    RawDataFormResponse[]
  >(),
  add: rpcMethodTypeContainer<
    {
      form_def: AddRawDataFormRequest;
    },
    RawDataFormResponse
  >(),
  patch: rpcMethodTypeContainer<
    {
      update_form_def: UpdateRawDataFormRequest;
    },
    RawDataFormResponse
  >(),
  delete: rpcMethodTypeContainer<
    {
      form_id: RawDataForm['id'];
    },
    void
  >(),
  submit: rpcMethodTypeContainer<
    {
      form_token: RawDataForm['token'];
      values: Record<string, unknown>;
    },
    void
  >(),
  regenerate_token: rpcMethodTypeContainer<
    {
      form_id: RawDataForm['id'];
    },
    string
  >(),
  set_publish_public: rpcMethodTypeContainer<
    {
      form_id: RawDataForm['id'];
      publish_public: boolean;
    },
    boolean
  >(),
};
