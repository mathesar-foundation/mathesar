import type { RawDataForm, RawDataFormField } from '@mathesar/api/rpc/forms';

import type { DataFormStructure } from './DataFormStructure';
import type { FieldColumn } from './FieldColumn';
import type { FkField, FkFieldProps } from './FkField';
import type { ScalarField, ScalarFieldProps } from './ScalarField';

export interface AbstractEphemeralFieldProps {
  key: RawDataFormField['key'];
  label: RawDataFormField['label'];
  help: RawDataFormField['help'];
  index: RawDataFormField['index'];
  styling: RawDataFormField['styling'];
}

export interface AbstractEphemeralColumnBasedFieldProps
  extends AbstractEphemeralFieldProps {
  isRequired: RawDataFormField['is_required'];
  fieldColumn: FieldColumn;
}

export type EphemeralDataFormFieldProps = ScalarFieldProps | FkFieldProps;
export type EphemeralDataFormField = ScalarField | FkField;

// This may contain more types in the future, such as ReverseFkField
export type ParentEphemeralDataFormField = FkField;

export interface DataFormStructureProps {
  baseTableOid: number;
  schemaOid: number;
  databaseId: number;
  token: RawDataForm['token'];
  name: RawDataForm['name'];
  description: RawDataForm['description'];
  headerTitle: RawDataForm['header_title'];
  headerSubTitle: RawDataForm['header_subtitle'];
  associatedRoleId: RawDataForm['associated_role_id'];
  submitMessage: RawDataForm['submit_message'];
  submitRedirectUrl: RawDataForm['submit_redirect_url'];
  submitButtonLabel: RawDataForm['submit_button_label'];
  fields: Iterable<EphemeralDataFormFieldProps>;
}

/** Types for change detection */

export type EdfFieldListDetail =
  | {
      type: 'add' | 'delete';
      field: EphemeralDataFormField;
    }
  | { type: 'reconstruct' };

export type EdfDirectProps =
  | 'name'
  | 'description'
  | 'headerTitle'
  | 'headerSubtitle'
  | 'associatedRoleId'
  | 'submitMessage'
  | 'submitRedirectUrl'
  | 'submitButtonLabel';

export type EdfChange =
  | {
      target: DataFormStructure;
      prop: EdfDirectProps;
    }
  | {
      target: DataFormStructure;
      prop: 'fields';
      detail: EdfFieldListDetail;
    };

export type EdfBaseFieldProps =
  | 'index'
  | 'label'
  | 'help'
  | 'isRequired'
  | 'styling';

export interface EdfScalarFieldPropChange {
  target: ScalarField;
  prop: EdfBaseFieldProps;
}

export type EdfFkFieldPropChange =
  | {
      target: FkField;
      prop: EdfBaseFieldProps | 'interactionRule';
    }
  | {
      target: FkField;
      prop: 'nestedFields';
      detail: EdfFieldListDetail;
    };

export type EdfNestedFieldChanges =
  | EdfScalarFieldPropChange
  | EdfFkFieldPropChange;
