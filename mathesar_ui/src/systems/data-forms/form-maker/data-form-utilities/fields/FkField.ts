import { type Readable, get, readable, writable } from 'svelte/store';

import type { RawForeignKeyDataFormField } from '@mathesar/api/rpc/forms';
import { getLinkedRecordInputCap } from '@mathesar/components/cell-fabric/utils';
import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';

import type { DataFormStructureCtx } from '../DataFormStructure';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldModifiableProps,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { DataFormFieldFactory } from './factories';
import { DataFormFieldFkInputValueHolder } from './FieldValueHolder';
import type { DataFormFieldContainerFactory, FormFields } from './FormFields';

interface FkFieldProps extends AbstractColumnBasedFieldProps {
  kind: RawForeignKeyDataFormField['kind'];
  interactionRule: RawForeignKeyDataFormField['fk_interaction_rule'];
  relatedTableOid: number;
  createFields: DataFormFieldContainerFactory;
}

export type FkFieldPropChangeEvent = {
  type: 'fk-field/prop';
  target: FkField;
  prop:
    | AbstractColumnBasedFieldModifiableProps
    | keyof Pick<FkFieldProps, 'interactionRule'>;
};

export class FkField extends AbstractColumnBasedField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly fieldValueHolder: DataFormFieldFkInputValueHolder;

  readonly relatedTableOid;

  readonly nestedFields;

  readonly inputComponentAndProps: AbstractColumnBasedField['inputComponentAndProps'];

  private _interactionRule;

  get interactionRule(): Readable<
    RawForeignKeyDataFormField['fk_interaction_rule']
  > {
    return this._interactionRule;
  }

  constructor(
    holder: FormFields,
    props: FkFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    super(holder, props, structureCtx);
    this.relatedTableOid = props.relatedTableOid;
    this.nestedFields = props.createFields(this, this.structureCtx);
    const fkLink = this.fieldColumn.foreignKeyLink;
    if (!fkLink) {
      // TODO_FORMS: Gracefully handle error scenario where foreign key constraint is removed later
      throw Error('The passed column is not a foreign key');
    }
    this._interactionRule = writable(props.interactionRule);
    this.fieldValueHolder = new DataFormFieldFkInputValueHolder(
      this.key,
      this.isRequired,
      this.interactionRule,
    );
    this.inputComponentAndProps = readable(
      getLinkedRecordInputCap({
        recordSelectionOrchestratorFactory: makeRowSeekerOrchestratorFactory({
          constructRecordStore: structureCtx.rowSeekerRecordStoreConstructor({
            key: this.key,
            tableOid: this.fieldColumn.tableOid,
            columnAttnum: this.fieldColumn.column.id,
            relatedTableOid: fkLink.relatedTableOid,
          }),
        }),
      }),
    );
  }

  async setInteractionRule(
    rule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<Iterable<DataFormFieldFactory>>,
  ) {
    this._interactionRule.set(rule);
    this.triggerChangeEvent('interactionRule');

    if (get(this.nestedFields).length === 0) {
      const defaultNestedFieldsFactories = await getDefaultNestedFields();
      this.nestedFields.reconstruct(defaultNestedFieldsFactories);
    }
  }

  protected triggerChangeEvent(prop: FkFieldPropChangeEvent['prop']) {
    this.structureCtx.changeEventHandler?.trigger({
      type: 'fk-field/prop',
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
