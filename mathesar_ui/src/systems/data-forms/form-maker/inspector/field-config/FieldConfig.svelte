<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import {
    Checkbox,
    LabeledInput,
    TextInput,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../../data-form-utilities/fields';

  import FieldAppearance from './FieldAppearance.svelte';
  import FieldValidation from './FieldValidation.svelte';
  import FkFieldConfig from './FkFieldConfig.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: DataFormField;
  $: ({ label, help } = field);
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

  {#if 'fieldColumn' in field}
    <FieldValidation {field} />
  {/if}

  {#if field.kind === 'foreign_key'}
    <FkFieldConfig {dataFormManager} {field} />
  {/if}

  <FieldAppearance {field} />
</InspectorTabContent>
