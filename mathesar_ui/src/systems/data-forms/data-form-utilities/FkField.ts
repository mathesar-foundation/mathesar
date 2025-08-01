import { type Readable, get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RawForeignKeyDataFormField } from '@mathesar/api/rpc/forms';

import { AbstractEphermeralColumnBasedField } from './AbstractEphmeralColumnBasedField';
import { DataFormFieldFkInputValueHolder } from './FieldValueHolder';
// eslint-disable-next-line import/no-cycle
import { FormFields } from './FormFields';
import type {
  AbstractEphemeralColumnBasedFieldProps,
  DataFormFieldProps,
  EdfBaseFieldProps,
  EdfFkFieldPropChange,
  EdfNestedFieldChanges,
} from './types';

export interface FkFieldProps extends AbstractEphemeralColumnBasedFieldProps {
  kind: RawForeignKeyDataFormField['kind'];
  interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
  relatedTableOid: number;
  nestedFields: Iterable<DataFormFieldProps>;
}

export class FkField extends AbstractEphermeralColumnBasedField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly fieldValueHolder: DataFormFieldFkInputValueHolder;

  readonly relatedTableOid;

  readonly nestedFields;

  private _interactionRule;

  get interactionRule(): Readable<
    RawForeignKeyDataFormField['fk_interaction_rule']
  > {
    return this._interactionRule;
  }

  protected onChange;

  constructor(
    holder: FormFields,
    props: FkFieldProps,
    onChange: (e: EdfFkFieldPropChange | EdfNestedFieldChanges) => unknown,
  ) {
    super(holder, props);
    this.onChange = onChange;
    this.relatedTableOid = props.relatedTableOid;
    this.nestedFields = new FormFields(this, props.nestedFields, (e) => {
      if ('target' in e) {
        this.onChange(e);
        return;
      }
      this.onChange({
        target: this,
        prop: 'nestedFields',
        detail: e,
      });
    });
    const fkLink = this.fieldColumn.foreignKeyLink;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this._interactionRule = writable(props.interactionRule);
    this.fieldValueHolder = new DataFormFieldFkInputValueHolder(
      this.key,
      this.isRequired,
      this.interactionRule,
    );
  }

  async setInteractionRule(
    rule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<Iterable<DataFormFieldProps>>,
  ) {
    this._interactionRule.set(rule);
    this.bubblePropChange('interactionRule');

    if (get(this.nestedFields).length === 0) {
      const defaultNestedFields = await getDefaultNestedFields();
      this.nestedFields.reconstruct(defaultNestedFields);
    }
  }

  protected bubblePropChange(prop: EdfBaseFieldProps | 'interactionRule') {
    this.onChange({
      target: this,
      prop,
    });
  }

  toRawEphemeralField(): RawForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      related_table_oid: this.relatedTableOid,
      fk_interaction_rule: get(this.interactionRule),
      child_fields: get(this.nestedFields).map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}
