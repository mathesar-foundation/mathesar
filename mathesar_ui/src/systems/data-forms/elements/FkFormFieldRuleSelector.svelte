<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type RawForeignKeyDataFormField,
    fkFieldInteractionRules,
  } from '@mathesar/api/rpc/forms';
  import { Select } from '@mathesar-component-library';
  import type { Appearance } from '@mathesar-component-library/types';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';
  import { tableStructureSubstanceToEphemeralFieldProps } from '../data-form-utilities/transformers';
  import type { EphemeralDataFormFieldProps } from '../data-form-utilities/types';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: EphermeralFkField;
  export let apperance: Appearance = 'outcome';

  $: ({ interactionRule, relatedTableOid } = dataFormField);
  $: linkedTableStructure = dataFormManager.getTableStructure(relatedTableOid);

  const interactionRuleText: Record<
    RawForeignKeyDataFormField['fk_interaction_rule'],
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

  async function getDefaultNestedFields(): Promise<
    EphemeralDataFormFieldProps[]
  > {
    const tableStructureSubstance =
      await linkedTableStructure.getSubstanceOnceResolved();
    if (tableStructureSubstance.resolvedValue) {
      return tableStructureSubstanceToEphemeralFieldProps(
        tableStructureSubstance.resolvedValue,
      );
    }
    return [];
  }
</script>

<Select
  triggerAppearance={apperance}
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
