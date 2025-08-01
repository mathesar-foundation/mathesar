import type { RawDataFormField } from '@mathesar/api/rpc/forms';

import type { AbstractFieldProps } from './AbstractField';
import type { DataFormStructure } from './DataFormStructure';
import type { FieldColumn } from './FieldColumn';
import type { FkField, FkFieldProps } from './FkField';
import type { ScalarField, ScalarFieldProps } from './ScalarField';

export interface AbstractEphemeralColumnBasedFieldProps
  extends AbstractFieldProps {
  isRequired: RawDataFormField['is_required'];
  fieldColumn: FieldColumn;
}

export type DataFormFieldProps = ScalarFieldProps | FkFieldProps;
export type DataFormField = ScalarField | FkField;

// This may contain more types in the future, such as ReverseFkField
export type ParentEphemeralDataFormField = FkField;

/** Types for change detection */

export type EdfFieldListDetail =
  | {
      type: 'add' | 'delete';
      field: DataFormField;
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
