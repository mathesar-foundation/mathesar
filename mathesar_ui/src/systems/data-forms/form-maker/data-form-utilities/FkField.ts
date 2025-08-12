import { type Readable, get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RawForeignKeyDataFormField } from '@mathesar/api/rpc/forms';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { DataFormFieldFactory } from './DataFormField';
import { DataFormFieldFkInputValueHolder } from './FieldValueHolder';
// eslint-disable-next-line import/no-cycle
import { type DataFormFieldContainerFactory, FormFields } from './FormFields';
import type { FormSource } from './FormSource';
import type {
  EdfBaseFieldProps,
  EdfFkFieldPropChange,
  EdfNestedFieldChanges,
} from './types';

interface FkFieldProps extends AbstractColumnBasedFieldProps {
  kind: RawForeignKeyDataFormField['kind'];
  interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
  relatedTableOid: number;
  createFields: DataFormFieldContainerFactory;
}

export type FkFieldOnChange = (
  e: EdfFkFieldPropChange | EdfNestedFieldChanges,
) => unknown;

export class FkField extends AbstractColumnBasedField {
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
    onChange: FkFieldOnChange,
  ) {
    super(holder, props);
    this.onChange = onChange;
    this.relatedTableOid = props.relatedTableOid;
    this.nestedFields = props.createFields(this, (e) => {
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
    getDefaultNestedFields: () => Promise<Iterable<DataFormFieldFactory>>,
  ) {
    this._interactionRule.set(rule);
    this.bubblePropChange('interactionRule');

    if (get(this.nestedFields).length === 0) {
      const defaultNestedFieldsFactories = await getDefaultNestedFields();
      this.nestedFields.reconstruct(defaultNestedFieldsFactories);
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

  static factoryFromRawInfo(
    props: {
      parentTableOid: number;
      rawField: RawForeignKeyDataFormField;
    },
    formSource: FormSource,
  ) {
    const { rawField } = props;
    const baseProps = super.getBasePropsFromRawDataFormField(props, formSource);

    return (holder: FormFields, onChange: FkFieldOnChange) =>
      new FkField(
        holder,
        {
          ...baseProps,
          kind: rawField.kind,
          relatedTableOid: rawField.related_table_oid,
          createFields: FormFields.factoryFromRawInfo(
            {
              parentTableOid: rawField.related_table_oid,
              rawDataFormFields: rawField.child_fields ?? [],
            },
            formSource,
          ),
          interactionRule: rawField.fk_interaction_rule,
        },
        onChange,
      );
  }
}
