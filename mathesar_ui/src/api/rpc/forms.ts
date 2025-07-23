import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawColumnWithMetadata } from './columns';
import type { RawDatabase } from './databases';
import type { RawConfiguredRole } from './roles';
import type { RawTable } from './tables';

export interface RichTextJson {
  text: string;
}

/**
 * Ephemeral raw types
 */

export interface RawEphemeralDataFormBaseField {
  key: string;
  index: number;
  label?: string | null;
  help?: string | null;
  styling?: {
    size?: 'regular' | 'large';
  } | null;
  is_required: boolean;
}

export interface RawEphemeralScalarDataFormField
  extends RawEphemeralDataFormBaseField {
  kind: 'scalar_column';
  column_attnum: number;
}

export const fkFieldInteractionRules = [
  'must_pick',
  'can_pick_or_create',
  'must_create',
] as const;

export interface RawEphemeralForeignKeyDataFormField
  extends RawEphemeralDataFormBaseField {
  kind: 'foreign_key';
  column_attnum: number;
  related_table_oid: number;
  fk_interaction_rule: (typeof fkFieldInteractionRules)[number];
  child_fields: RawEphemeralDataFormField[] | null;
}

export type RawEphemeralDataFormField =
  | RawEphemeralScalarDataFormField
  | RawEphemeralForeignKeyDataFormField;

export interface RawEphemeralDataForm {
  database_id: number;
  base_table_oid: number;
  schema_oid: number;
  name: string;
  description: string | null;
  version: number;
  associated_role_id: RawConfiguredRole['id'] | null;
  header_title: RichTextJson;
  header_subtitle: RichTextJson | null;
  fields: RawEphemeralDataFormField[];
  submit_message?: RichTextJson | null;
  submit_redirect_url?: string | null;
  submit_button_label?: string | null;
}

/**
 * Persisted raw types
 */

export interface RawDataFormBaseField extends RawEphemeralDataFormBaseField {
  id: number;
}
export interface RawScalarDataFormField
  extends RawDataFormBaseField,
    RawEphemeralScalarDataFormField {}

export interface RawForeignKeyDataFormField
  extends RawDataFormBaseField,
    RawEphemeralForeignKeyDataFormField {
  child_fields: RawDataFormField[] | null;
}

export interface ReplacableRawDataForm extends RawEphemeralDataForm {
  id: number;
}

export type RawDataFormField =
  | RawScalarDataFormField
  | RawForeignKeyDataFormField;

export interface RawDataForm extends RawEphemeralDataForm {
  id: number;
  token: string;
  fields: RawDataFormField[];
  publish_public: boolean;
}

export interface RawDataFormResponse extends RawDataForm {
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

export interface SummarizedRecordReference {
  summary: string;
  key: string | number | boolean | null;
}

export interface RecordsSummaryListResponse {
  count: number;
  results: SummarizedRecordReference[];
}

export const forms = {
  get: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      form_id: RawDataForm['id'];
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
      form_def: RawEphemeralDataForm;
    },
    RawDataFormResponse
  >(),
  replace: rpcMethodTypeContainer<
    {
      new_form: ReplacableRawDataForm;
    },
    RawDataFormResponse
  >(),
  delete: rpcMethodTypeContainer<
    {
      form_id: RawDataForm['id'];
    },
    void
  >(),
  list_related_records: rpcMethodTypeContainer<
    {
      form_token: string;
      field_key: string;
      limit?: number | null;
      offset?: number | null;
      search?: string | null;
    },
    RecordsSummaryListResponse
  >(),
};
