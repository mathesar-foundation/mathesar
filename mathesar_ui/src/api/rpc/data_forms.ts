import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawDatabase } from './databases';
import type { RawConfiguredRole } from './roles';
import type { RawTable } from './tables';

export interface RichTextJson {
  text: string;
}

export interface RawDataFormBaseField {
  id: number;
  key: string;
  label: string | null;
  help: string | null;
  placeholder: string | null;
  styling: Record<string, unknown>;
  index: number;
}

export interface RawScalarDataFormField extends RawDataFormBaseField {
  kind: 'scalar_column';
  column_attnum: number;
}

export interface RawForeignKeyDataFormField extends RawDataFormBaseField {
  kind: 'foreign_key';
  column_attnum: number;
  constraint_oid: number;
  creation_settings: RelatedTableRowCreationSettings | null;

  // received
  target_table_oid: number;
  target_columns: number[];
}

export interface RawReverseForeignKeyDataFormField
  extends RawDataFormBaseField {
  kind: 'reverse_foreign_key';
  constraint_oid: number;
  creation_settings: RelatedTableRowCreationSettings;

  // received
  base_table_referent_columns: number[];
  linked_table_oid: number;
  linked_columns: number[];
}

export interface RelatedTableRowCreationSettings {
  label: string;
  nested_fields: RawDataFormField[];
}

export type RawDataFormField =
  | RawScalarDataFormField
  | RawForeignKeyDataFormField
  | RawReverseForeignKeyDataFormField;

export interface RawSubmissionInfo {
  message: RichTextJson | null;
  redirect_url: string | null;
  button_label: string | null;
}

export interface RawDataForm {
  id: number;
  token: string;
  database_id: number;
  base_table_oid: number;
  schema_oid: number;
  name: string;
  description: string | null;
  header_title: RichTextJson;
  header_subtitle: RichTextJson | null;
  fields: RawDataFormField[];
  associated_role: RawConfiguredRole['id'] | null;
  submission: RawSubmissionInfo;
  is_public: boolean;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const data_forms = {
  get: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      form_id: RawDataForm['id'];
    },
    RawDataForm
  >(),
  add: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      base_table_oid: RawTable['oid'];
    },
    RawDataForm
  >(),
  replace: rpcMethodTypeContainer<
    {
      form_def: RawDataForm;
    },
    RawDataForm
  >(),
};
