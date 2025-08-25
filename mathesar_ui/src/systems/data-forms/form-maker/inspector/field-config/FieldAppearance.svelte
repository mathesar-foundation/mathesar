<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import {
    Checkbox,
    LabeledInput,
    Select,
    TextInput,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import {
    type DataFormField,
    ErrorField,
  } from '../../data-form-utilities/fields';

  export let field: DataFormField;

  $: isErrorField = field instanceof ErrorField;
  $: ({ styling, kind, help } = field);
  $: columnBasedField = 'fieldColumn' in field ? field : undefined;

  $: showSizeConfig =
    kind === 'scalar_column' &&
    columnBasedField?.fieldColumn.abstractType.cellInfo.type === 'string';

  $: size = $styling?.size ?? 'regular';
  const sizeOptions = ['regular', 'large'] as const;
</script>

<InspectorSection title={$_('presentation')}>
  <section class="appearance">
    {#if showSizeConfig}
      <LabeledInput layout="stacked" label={$_('size')}>
        <Select
          value={size}
          options={sizeOptions}
          getLabel={(option) => {
            if (isDefinedNonNullable(option)) {
              return option === 'regular' ? $_('regular') : $_('large');
            }
            return '';
          }}
          on:change={(e) => field.updateStyling({ size: e.detail })}
        />
      </LabeledInput>
    {/if}

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
        placeholder={$_('field_add_help_text')}
        on:input={(e) => {
          field.setHelpText(getStringValueFromEvent(e));
        }}
      />
    {/if}
  </section>
</InspectorSection>

<style lang="scss">
  section.appearance {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
  }
</style>
