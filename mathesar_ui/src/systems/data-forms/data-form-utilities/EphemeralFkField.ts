import { type Readable, derived, get, writable } from 'svelte/store';

import type {
  RawEphemeralForeignKeyDataFormField,
  RawForeignKeyDataFormField,
} from '@mathesar/api/rpc/forms';
import { type FieldStore, optionalField } from '@mathesar/components/form';

import { AbstractEphemeralField } from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';
// eslint-disable-next-line import/no-cycle
import { FormFields } from './FormFields';
import type {
  EphemeralDataFormFieldProps,
  EphemeralFkFieldProps,
} from './types';

export class EphermeralFkField extends AbstractEphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly fieldColumn;

  readonly relatedTableOid;

  readonly nestedFields;

  readonly fieldStore: FieldStore;

  readonly inputComponentAndProps;

  private _interactionRule;

  get interactionRule(): Readable<
    RawForeignKeyDataFormField['fk_interaction_rule']
  > {
    return this._interactionRule;
  }

  constructor(holder: FormFields, props: EphemeralFkFieldProps) {
    super(holder, props);
    this.fieldColumn = props.fieldColumn;
    this.relatedTableOid = props.relatedTableOid;
    this.nestedFields = new FormFields(this, props.nestedFields);
    const fkLink = this.fieldColumn.foreignKeyLink;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this._interactionRule = writable(props.interactionRule);
    this.fieldStore = optionalField(null);
    this.inputComponentAndProps = derived(this.styling, (styling) =>
      this.fieldColumn.getInputComponentAndProps(styling),
    );
  }

  async setInteractionRule(
    rule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<
      Iterable<EphemeralDataFormFieldProps>
    >,
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

  toRawEphemeralField(): RawEphemeralForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      column_attnum: this.fieldColumn.column.id,
      related_table_oid: this.relatedTableOid,
      fk_interaction_rule: get(this.interactionRule),
      child_fields: get(this.nestedFields).map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
