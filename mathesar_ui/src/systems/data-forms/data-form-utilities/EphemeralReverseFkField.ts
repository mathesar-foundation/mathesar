import type {
  RawEphemeralReverseForeignKeyDataFormField,
  RawReverseForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';

import {
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';
import { AbstractParentEphemeralField } from './AbstractParentEphemeralField';

export class EphemeralReverseFkField extends AbstractParentEphemeralField {
  readonly kind: RawReverseForeignKeyDataFormField['kind'] =
    'reverse_foreign_key';

  readonly reverseFkConstraintOid;

  readonly relatedTableOid;

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & {
      nestedFields: Iterable<EphemeralDataFormField>;
      reverseFkConstraintOid: number;
      relatedTableOid: number;
    },
  ) {
    super(parentField, data);
    this.reverseFkConstraintOid = data.reverseFkConstraintOid;
    this.relatedTableOid = data.relatedTableOid;
  }

  toRawEphemeralField(): RawEphemeralReverseForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'reverse_foreign_key',
      constraint_oid: this.reverseFkConstraintOid,
      related_table_oid: this.relatedTableOid,
    };
  }
}
