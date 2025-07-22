import { type Readable, derived, get, writable } from 'svelte/store';

import type {
  RawEphemeralForeignKeyDataFormField,
  RawForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';

import type {
  EphemeralDataFormField,
  EphemeralFieldProps,
  ParentEphemeralField,
} from './AbstractEphemeralField';
import { AbstractParentEphemeralField } from './AbstractParentEphemeralField';
import type { FieldColumn } from './FieldColumn';

export class EphermeralFkField extends AbstractParentEphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly relatedTableOid;

  readonly fieldColumn;

  readonly fieldStore: FieldStore;

  readonly inputComponentAndProps;

  private _interactionRule;

  get interactionRule(): Readable<
    RawForeignKeyDataFormField['fk_interaction_rule']
  > {
    return this._interactionRule;
  }

  constructor(
    parentField: ParentEphemeralField,
    props: EphemeralFieldProps & {
      fieldColumn: FieldColumn;
      interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
      nestedFields?: Iterable<EphemeralDataFormField>;
      relatedTableOid: number;
    },
  ) {
    super(parentField, {
      ...props,
      nestedFields: props.nestedFields ?? [],
    });
    this.fieldColumn = props.fieldColumn;
    const fkLink = this.fieldColumn.foreignKeyLink;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this._interactionRule = writable(props.interactionRule);
    this.relatedTableOid = props.relatedTableOid;
    this.fieldStore = optionalField(null);
    this.inputComponentAndProps = derived(this.styling, (styling) =>
      this.fieldColumn.getInputComponentAndProps(styling),
    );
  }

  async setInteractionRule(
    rule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<Iterable<EphemeralDataFormField>>,
  ) {
    this._interactionRule.set(rule);
    if (get(this.nestedFields).length === 0) {
      const defaultNestedFields = await getDefaultNestedFields();
      this.nestedFields.reconstruct(defaultNestedFields);
    }
  }

  hasColumn(fieldColumn: FieldColumn) {
    return (
      this.fieldColumn.tableOid === fieldColumn.tableOid &&
      this.fieldColumn.column.id === fieldColumn.column.id &&
      this.relatedTableOid === fieldColumn.foreignKeyLink?.relatedTableOid
    );
  }

  isConceptuallyEqual(dataFormField: EphemeralDataFormField) {
    return (
      dataFormField.kind === this.kind &&
      this.hasColumn(dataFormField.fieldColumn)
    );
  }

  toRawEphemeralField(): RawEphemeralForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      column_attnum: this.fieldColumn.column.id,
      related_table_oid: this.relatedTableOid,
      fk_interaction_rule: get(this.interactionRule),
    };
  }
}
