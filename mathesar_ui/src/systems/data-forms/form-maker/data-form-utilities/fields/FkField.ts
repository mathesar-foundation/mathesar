import { type Readable, derived, get, writable } from 'svelte/store';

import type { RawForeignKeyDataFormField } from '@mathesar/api/rpc/forms';
import { getLinkedRecordInputCap } from '@mathesar/components/cell-fabric/utils';
import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';
import { isDefinedNonNullable } from '@mathesar-component-library';

import type { DataFormStructureCtx } from '../DataFormStructure';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldModifiableProps,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { DataFormField, DataFormFieldFactory } from './factories';
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

  private cachedNestedFieldsBeforeMustPick: DataFormField[] | undefined;

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
      throw Error(
        'The passed column is not a foreign key. This should never occur',
      );
    }
    this._interactionRule = writable(props.interactionRule);
    this.fieldValueHolder = new DataFormFieldFkInputValueHolder(
      this.key,
      this.isRequired,
      this.interactionRule,
    );
    this.inputComponentAndProps = derived(
      this.interactionRule,
      ($interactionRule) =>
        getLinkedRecordInputCap({
          recordSelectionOrchestratorFactory: makeRowSeekerOrchestratorFactory({
            constructRecordStore: structureCtx.rowSeekerRecordStoreConstructor({
              key: this.key,
              tableOid: this.fieldColumn.tableOid,
              columnAttnum: this.fieldColumn.column.id,
              relatedTableOid: fkLink.relatedTableOid,
            }),
            onSelect: (v) => {
              if (isDefinedNonNullable(v)) {
                this.fieldValueHolder.setUserAction('pick');
              }
            },
            addRecordOptions:
              $interactionRule === 'must_pick'
                ? undefined
                : {
                    create: async () => {
                      this.fieldValueHolder.setUserAction('create');
                      return undefined;
                    },
                  },
          }),
        }),
    );
  }

  async setInteractionRule(
    nextRule: RawForeignKeyDataFormField['fk_interaction_rule'],
    getDefaultNestedFields: () => Promise<Iterable<DataFormFieldFactory>>,
  ) {
    const prevRule = get(this._interactionRule);
    if (nextRule === prevRule) {
      return;
    }
    this._interactionRule.set(nextRule);
    this.triggerChangeEvent('interactionRule');

    if (prevRule !== 'must_pick') {
      /* We're caching this for UX convenience when users are building the form.
       *
       * We'd like to preseve the changes to the nested fields when users change
       * `interactionRule` while building the form, so that when they change the
       * rule back, their changes are not lost.
       */
      this.cachedNestedFieldsBeforeMustPick = get(this.nestedFields);
    }

    if (nextRule === 'must_pick') {
      this.nestedFields.reconstruct([]);
      return;
    }

    if (prevRule === 'must_pick') {
      if (this.cachedNestedFieldsBeforeMustPick === undefined) {
        const defaultNestedFieldsFactories = await getDefaultNestedFields();
        this.nestedFields.reconstruct(defaultNestedFieldsFactories);
        return;
      }

      this.nestedFields.reconstructWithFields(
        this.cachedNestedFieldsBeforeMustPick,
      );
    }
  }

  protected triggerChangeEvent(prop: FkFieldPropChangeEvent['prop']) {
    this.structureCtx.changeEventHandler?.trigger({
      type: 'fk-field/prop',
      target: this,
      prop,
    });
  }

  toRawEphemeralField(options?: {
    withoutErrorFields: boolean;
  }): RawForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      related_table_oid: this.relatedTableOid,
      fk_interaction_rule: get(this.interactionRule),
      child_fields: this.nestedFields.toRawFields(options),
    };
  }
}
