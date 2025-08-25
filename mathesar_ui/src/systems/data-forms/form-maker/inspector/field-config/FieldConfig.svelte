<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import {
    Button,
    Icon,
    LabeledInput,
    TextInput,
    Tooltip,
    getStringValueFromEvent,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import {
    type DataFormField,
    ErrorField,
  } from '../../data-form-utilities/fields';
  import FkFormFieldRuleSelector from '../../elements/FkFormFieldRuleSelector.svelte';
  import FormFieldSource from '../../elements/FormFieldSource.svelte';

  import FieldAppearance from './FieldAppearance.svelte';
  import FieldValidation from './FieldValidation.svelte';
  import FkRecordSummaryConfig from './FkRecordSummaryConfig.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField;
  $: ({ label } = field);

  $: isErrorField = field instanceof ErrorField;
</script>

<InspectorTabContent>
  <InspectorSection title={$_('field_properties')}>
    <LabeledInput layout="stacked" label={$_('field_label')}>
      <TextInput
        value={$label}
        disabled={isErrorField}
        on:input={(e) => field.setLabel(getStringValueFromEvent(e))}
        on:blur={() => field.checkAndSetDefaultLabel()}
      />
    </LabeledInput>
    {#if 'fieldColumn' in field}
      <div class="source-info">
        <span>{$_('column')}:</span>
        <FormFieldSource
          {dataFormManager}
          dataFormField={field}
          link
          separator
        />
      </div>
    {/if}
  </InspectorSection>

  {#if 'fieldColumn' in field}
    <InspectorSection title={$_('rules')}>
      <section class="rules">
        <FieldValidation {field} />
        {#if field.kind === 'foreign_key'}
          <LabeledInput layout="stacked" label={$_('field_fk_rule_label')}>
            <FkFormFieldRuleSelector
              appearance="default"
              {dataFormManager}
              dataFormField={field}
            />
          </LabeledInput>
        {/if}
      </section>
    </InspectorSection>
  {/if}

  <FieldAppearance {field} />

  {#if field.kind === 'foreign_key'}
    <FkRecordSummaryConfig {dataFormManager} {field} />
  {/if}

  <InspectorSection title={$_('actions')}>
    <Tooltip enabled={!field.canDelete}>
      <div slot="trigger" class="remove-button">
        <Button
          disabled={!field.canDelete}
          appearance="outline-primary"
          on:click={() => field.container.delete(field)}
        >
          <Icon {...iconDeleteMajor} />
          <span>{$_('remove_field')}</span>
        </Button>
      </div>
      <span slot="content">{$_('field_cannot_be_removed_required_in_db')}</span>
    </Tooltip>
  </InspectorSection>
</InspectorTabContent>

<style lang="scss">
  .remove-button {
    display: flex;
    flex-direction: column;
  }
  section.rules {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
  }
</style>
