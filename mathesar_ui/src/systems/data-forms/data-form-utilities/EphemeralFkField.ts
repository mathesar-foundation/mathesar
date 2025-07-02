import { type Writable, get, writable } from 'svelte/store';

import type {
  RawEphemeralForeignKeyDataFormField,
  RawForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { WritableMap } from '@mathesar-component-library';

import {
  AbstractEphemeralField,
  type EphemeralDataFormField,
  type EphemeralFieldProps,
  type ParentEphemeralField,
} from './AbstractEphemeralField';

export const fkFieldInteractionRules = [
  'only_select',
  'select_or_create',
  'must_create',
] as const;

export type FkFieldInteractionRule = (typeof fkFieldInteractionRules)[number];

export class EphermeralFkField extends AbstractEphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly processedColumn;

  readonly fkConstraintOid;

  readonly relatedTableOid;

  readonly fieldStore: FieldStore;

  readonly rule: Writable<FkFieldInteractionRule>;

  readonly nestedFields: WritableMap<string, EphemeralDataFormField>;

  constructor(
    parentField: ParentEphemeralField,
    props: EphemeralFieldProps & {
      processedColumn: ProcessedColumn;
      rule: FkFieldInteractionRule;
      nestedFields?: Iterable<EphemeralDataFormField>;
      fkConstraintOid: number;
      relatedTableOid: number;
    },
  ) {
    super(parentField, props);
    this.processedColumn = props.processedColumn;
    const fkLink = this.processedColumn.linkFk;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this.rule = writable(props.rule);
    const nestedFieldIterable = props.nestedFields ?? [];
    this.nestedFields = new WritableMap(
      [...nestedFieldIterable].map((f) => [f.key, f]),
    );
    this.fieldStore = optionalField(null);
    this.fkConstraintOid = props.fkConstraintOid;
    this.relatedTableOid = props.relatedTableOid;
  }

  async setInteractionRule(
    rule: FkFieldInteractionRule,
    getDefaultNestedFields: () => Promise<Iterable<EphemeralDataFormField>>,
  ) {
    this.rule.set(rule);
    if (get(this.nestedFields).size === 0) {
      const defaultNestedFields = await getDefaultNestedFields();
      this.nestedFields.reconstruct(
        [...defaultNestedFields].map((f) => [f.key, f]),
      );
    }
  }

  setNestedFields(nestedFields: Iterable<EphemeralDataFormField>) {
    this.nestedFields.reconstruct([...nestedFields].map((f) => [f.key, f]));
  }

  toRawEphemeralField(): RawEphemeralForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      column_attnum: this.processedColumn.id,
      constraint_oid: this.fkConstraintOid,
      related_table_oid: this.relatedTableOid,
      child_fields: [...get(this.nestedFields).values()].map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
