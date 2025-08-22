<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import {
    Button,
    Checkbox,
    Icon,
    LabeledInput,
    TextInput,
    Tooltip,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import {
    type DataFormField,
    ErrorField,
  } from '../../data-form-utilities/fields';

  import FieldAppearance from './FieldAppearance.svelte';
  import FieldValidation from './FieldValidation.svelte';
  import FkFieldConfig from './FkFieldConfig.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField;
  $: ({ label, help } = field);

  $: isErrorField = field instanceof ErrorField;
</script>

<InspectorTabContent>
  <InspectorSection title={$_('field_text')}>
    <LabeledInput layout="stacked" label={$_('field_label')}>
      <TextInput
        value={$label}
        disabled={isErrorField}
        on:input={(e) => field.setLabel(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    <LabeledInput
      layout="inline-input-first"
      label={$_('field_provide_help_text')}
    >
      <Checkbox
        checked={isDefinedNonNullable($help)}
        disabled={isErrorField}
        on:change={(e) => field.setHelpText(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable($help)}
      <TextInput
        value={$help}
        disabled={isErrorField}
        on:input={(e) => {
          field.setHelpText(getStringValueFromEvent(e));
        }}
      />
    {/if}
  </InspectorSection>

  {#if 'fieldColumn' in field}
    <FieldValidation {field} />
  {/if}

  {#if field.kind === 'foreign_key'}
    <FkFieldConfig {dataFormManager} {field} />
  {/if}

  <FieldAppearance {field} />

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
</style>
