import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawColumnWithMetadata } from './columns';
import type { RawConstraint } from './constraints';
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
  styling: unknown;
  is_required: boolean;
}

export interface RawEphemeralScalarDataFormField
  extends RawEphemeralDataFormBaseField {
  kind: 'scalar_column';
  column_attnum: number;
}

export interface RawEphemeralForeignKeyDataFormField
  extends RawEphemeralDataFormBaseField {
  kind: 'foreign_key';
  column_attnum: number;
  constraint_oid: number;
  related_table_oid: number;
  child_fields: RawEphemeralDataFormField[] | null;
}

export interface RawEphemeralReverseForeignKeyDataFormField
  extends RawEphemeralDataFormBaseField {
  kind: 'reverse_foreign_key';
  constraint_oid: number;
  related_table_oid: number;
  child_fields: RawEphemeralDataFormField[];
}

export type RawEphemeralDataFormField =
  | RawEphemeralScalarDataFormField
  | RawEphemeralForeignKeyDataFormField
  | RawEphemeralReverseForeignKeyDataFormField;

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

export interface RawReverseForeignKeyDataFormField
  extends RawEphemeralReverseForeignKeyDataFormField {
  child_fields: RawDataFormField[];
}

export type RawDataFormField =
  | RawScalarDataFormField
  | RawForeignKeyDataFormField
  | RawReverseForeignKeyDataFormField;

export interface RawDataForm extends RawEphemeralDataForm {
  id: number;
  token: string;
  fields: RawDataFormField[];
  share_public: boolean;
  submit_message?: RichTextJson | null;
  submit_redirect_url?: string | null;
  submit_button_label?: string | null;
}

export interface RawDataFormResponse extends RawDataForm {
  created_at: string;
  updated_at: string;
}

// TODO: Move this to another RPC method
export interface RawDataFormGetResponse extends RawDataFormResponse {
  field_col_info_map: {
    tables: Record<
      string,
      {
        table_info: RawTable;
        columns: Record<string, RawColumnWithMetadata>;
      }
    >;
    constraints: Record<string, RawConstraint>;
  };
}

export const forms = {
  get: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      form_id: RawDataForm['id'];
    },
    RawDataFormGetResponse
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
    RawDataFormGetResponse
  >(),
};
