import { type Readable, get } from 'svelte/store';

import type {
  RawEphemeralReverseForeignKeyDataFormField,
  RawReverseForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';
import { type ImmutableMap, WritableMap } from '@mathesar-component-library';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';

export class EphemeralReverseFkField extends AbstractEphemeralField {
  readonly kind: RawReverseForeignKeyDataFormField['kind'] =
    'reverse_foreign_key';

  readonly reverseFkConstraintOid;

  readonly relatedTableOid;

  private _nestedFields;

  get nestedFields(): Readable<
    ImmutableMap<EphemeralDataFormField['key'], EphemeralDataFormField>
  > {
    return this._nestedFields;
  }

  constructor(
    parentField: ParentEphemeralField,
    data: EphemeralFieldProps & {
      nestedFields: Iterable<EphemeralDataFormField>;
      reverseFkConstraintOid: number;
      relatedTableOid: number;
    },
  ) {
    super(parentField, data);
    this._nestedFields = new WritableMap(
      [...data.nestedFields].map((f) => [f.key, f]),
    );
    this.reverseFkConstraintOid = data.reverseFkConstraintOid;
    this.relatedTableOid = data.relatedTableOid;
  }

  setNestedFields(nestedFields: Iterable<EphemeralDataFormField>) {
    this._nestedFields.reconstruct([...nestedFields].map((f) => [f.key, f]));
  }

  toRawEphemeralField(): RawEphemeralReverseForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'reverse_foreign_key',
      constraint_oid: this.reverseFkConstraintOid,
      related_table_oid: this.relatedTableOid,
      child_fields: [...get(this.nestedFields).values()].map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
