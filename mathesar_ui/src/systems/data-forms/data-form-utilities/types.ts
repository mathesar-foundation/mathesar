import type { DataFormStructure } from './DataFormStructure';
import type { FkField } from './FkField';
import type { DataFormField } from './FormFields';
import type { ScalarField } from './ScalarField';

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
