<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import {
    LabeledInput,
    Select,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';

  export let field: EphemeralDataFormField;

  $: ({ styling, kind, fieldColumn } = field);
  $: showSection =
    kind === 'scalar_column' &&
    fieldColumn.abstractType.cellInfo.type === 'string';

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
            return option === 'regular' ? $_('size_regular') : $_('size_large');
          }
          return '';
        }}
        on:change={(e) => field.updateStyling({ size: e.detail })}
      />
    </LabeledInput>
  </InspectorSection>
{/if}
