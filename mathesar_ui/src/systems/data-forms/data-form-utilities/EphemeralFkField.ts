import { type Readable, get, writable } from 'svelte/store';

import type {
  RawEphemeralForeignKeyDataFormField,
  RawForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

import {
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';
import { AbstractParentEphemeralField } from './AbstractParentEphemeralField';

export class EphermeralFkField extends AbstractParentEphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly processedColumn;

  readonly fkConstraintOid;

  readonly relatedTableOid;

  readonly fieldStore: FieldStore;

  private _interactionRule;

  get interactionRule(): Readable<
    RawForeignKeyDataFormField['fk_interaction_rule']
  > {
    return this._interactionRule;
  }

  constructor(
    parentField: ParentEphemeralField,
    props: EphemeralFieldProps & {
      processedColumn: ProcessedColumn;
      interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
      nestedFields?: Iterable<EphemeralDataFormField>;
      fkConstraintOid: number;
      relatedTableOid: number;
    },
  ) {
    super(parentField, {
      ...props,
      nestedFields: props.nestedFields ?? [],
    });
    this.processedColumn = props.processedColumn;
    const fkLink = this.processedColumn.linkFk;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this._interactionRule = writable(props.interactionRule);
    this.fieldStore = optionalField(null);
    this.fkConstraintOid = props.fkConstraintOid;
    this.relatedTableOid = props.relatedTableOid;
  }

  async setInteractionRule(
    rule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<Iterable<EphemeralDataFormField>>,
  ) {
    this._interactionRule.set(rule);
    if (get(this.nestedFields).size === 0) {
      const defaultNestedFields = await getDefaultNestedFields();
      this._nestedFields.reconstruct(
        [...defaultNestedFields].map((f) => [f.key, f]),
      );
    }
  }

  toRawEphemeralField(): RawEphemeralForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      column_attnum: this.processedColumn.id,
      constraint_oid: this.fkConstraintOid,
      related_table_oid: this.relatedTableOid,
      fk_interaction_rule: get(this.interactionRule),
    };
  }
}
