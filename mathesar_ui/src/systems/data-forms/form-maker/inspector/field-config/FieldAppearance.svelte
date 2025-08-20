<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import {
    LabeledInput,
    Select,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { DataFormField } from '../../data-form-utilities/fields';

  export let field: DataFormField;

  $: ({ styling, kind } = field);
  $: columnBasedField = 'fieldColumn' in field ? field : undefined;

  $: showSizeConfig =
    kind === 'scalar_column' &&
    columnBasedField?.fieldColumn.abstractType.cellInfo.type === 'string';

  $: showSection = showSizeConfig;

  $: size = $styling?.size ?? 'regular';
  const sizeOptions = ['regular', 'large'] as const;
</script>

{#if showSection}
  <InspectorSection title={$_('field_appearance')}>
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
  </InspectorSection>
{/if}
