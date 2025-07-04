<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type RawEphemeralForeignKeyDataFormField,
    fkFieldInteractionRules,
  } from '@mathesar/api/rpc/forms';
  import { Select } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';
  import { tableStructureSubstanceToEphemeralFields } from '../data-form-utilities/transformers';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ interactionRule, relatedTableOid } = dataFormField);
  $: linkedTableStructure = dataFormManager.getTableStructure(relatedTableOid);

  const interactionRuleText: Record<
    RawEphemeralForeignKeyDataFormField['fk_interaction_rule'],
    { short: string; help: string }
  > = {
    must_create: {
      short: $_('form_fk_must_create_label'),
      help: $_('form_fk_must_create_help'),
    },
    can_pick_or_create: {
      short: $_('form_fk_select_or_create_label'),
      help: $_('form_fk_select_or_create_help'),
    },
    must_pick: {
      short: $_('form_fk_only_select_label'),
      help: $_('form_fk_only_select_help'),
    },
  };

  async function getDefaultNestedFields(): Promise<EphemeralDataFormField[]> {
    const res = await linkedTableStructure.asyncStore.tick();
    const tableStructureSubstance = res.resolvedValue;
    if (tableStructureSubstance) {
      return tableStructureSubstanceToEphemeralFields(
        tableStructureSubstance,
        dataFormField,
      );
    }
    return [];
  }
</script>

<Select
  triggerAppearance="outcome"
  options={fkFieldInteractionRules}
  value={$interactionRule}
  on:change={(e) =>
    dataFormField.setInteractionRule(
      e.detail ?? 'must_pick',
      getDefaultNestedFields,
    )}
  let:option
>
  <div>
    <div>
      {option ? interactionRuleText[option].short : ''}
    </div>
    <div class="option-help">
      {option ? interactionRuleText[option].help : ''}
    </div>
  </div>

  <svelte:fragment slot="trigger" let:option={triggerOption}>
    {triggerOption ? interactionRuleText[triggerOption].short : ''}
  </svelte:fragment>
</Select>

<style lang="scss">
  .option-help {
    max-width: 25rem;
    white-space: normal;
    font-size: var(--sm1);
  }
</style>
