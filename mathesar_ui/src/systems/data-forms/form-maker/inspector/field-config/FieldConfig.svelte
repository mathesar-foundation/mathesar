<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import {
    Checkbox,
    LabeledInput,
    TextInput,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { DataFormField } from '../../data-form-utilities/DataFormField';
  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import FkFormFieldRuleSelector from '../../elements/FkFormFieldRuleSelector.svelte';

  import FieldAppearance from './FieldAppearance.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField;
  $: ({ label, help, fieldColumn, isRequired } = field);
  $: isRequiredOnDb = !fieldColumn.column.nullable;
  $: isFieldRequired = isRequiredOnDb || $isRequired;
</script>

<InspectorTabContent>
  <InspectorSection title={$_('field_text')}>
    <LabeledInput layout="stacked" label={$_('field_label')}>
      <TextInput
        value={$label}
        on:input={(e) => field.setLabel(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    <LabeledInput
      layout="inline-input-first"
      label={$_('field_provide_help_text')}
    >
      <Checkbox
        checked={isDefinedNonNullable($help)}
        on:change={(e) => field.setHelpText(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable($help)}
      <TextInput
        value={$help}
        on:input={(e) => {
          field.setHelpText(getStringValueFromEvent(e));
        }}
      />
    {/if}
  </InspectorSection>

  <InspectorSection title={$_('field_validation')}>
    <LabeledInput
      layout="inline-input-first"
      label={$_('field_validation_is_required')}
    >
      <Checkbox
        checked={isFieldRequired}
        disabled={isRequiredOnDb}
        on:change={(e) => field.setIsRequired(e.detail)}
      />
    </LabeledInput>
    {#if isRequiredOnDb}
      <div class="not-null-info">
        <InfoBox>
          {$_('field_marked_required_column_disallows_null')}
        </InfoBox>
      </div>
    {/if}
  </InspectorSection>

  {#if field.kind === 'foreign_key'}
    <InspectorSection title={$_('field_fk_rule_label')}>
      <FkFormFieldRuleSelector
        apperance="default"
        {dataFormManager}
        dataFormField={field}
      />
    </InspectorSection>
  {/if}

  <FieldAppearance {field} />
</InspectorTabContent>

<style lang="scss">
  .not-null-info {
    font-size: var(--sm1);
  }
</style>
