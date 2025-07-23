import type {
  RawDataFormBaseField,
  RawEphemeralForeignKeyDataFormField,
  RawEphemeralScalarDataFormField,
  RawForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';

import type { EphermeralFkField } from './EphemeralFkField';
import type { EphermeralScalarField } from './EphemeralScalarField';
import type { FieldColumn } from './FieldColumn';

export interface AbstractEphemeralFieldProps {
  key: RawDataFormBaseField['key'];
  label: RawDataFormBaseField['label'];
  help: RawDataFormBaseField['help'];
  index: RawDataFormBaseField['index'];
  isRequired: RawDataFormBaseField['is_required'];
  styling: RawDataFormBaseField['styling'];
}

export interface EphemeralScalarFieldProps extends AbstractEphemeralFieldProps {
  kind: RawEphemeralScalarDataFormField['kind'];
  fieldColumn: FieldColumn;
}

export interface EphemeralFkFieldProps extends AbstractEphemeralFieldProps {
  kind: RawEphemeralForeignKeyDataFormField['kind'];
  fieldColumn: FieldColumn;
  interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
  relatedTableOid: number;
  nestedFields: Iterable<EphemeralDataFormFieldProps>;
}

export type EphemeralDataFormFieldProps =
  | EphemeralScalarFieldProps
  | EphemeralFkFieldProps;

export type EphemeralDataFormField = EphermeralScalarField | EphermeralFkField;

// This may contain more types in the future, such as ReverseFkField
export type ParentEphemeralDataFormField = EphermeralFkField;
