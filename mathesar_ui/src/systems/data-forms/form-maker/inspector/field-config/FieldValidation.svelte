<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { Checkbox, LabeledInput } from '@mathesar-component-library';

  import type { ColumnBasedDataFormField } from '../../data-form-utilities/fields';

  export let field: ColumnBasedDataFormField;
  $: ({ fieldColumn, isRequired } = field);
  $: isRequiredOnDb = !fieldColumn.column.nullable;
  $: isFieldRequired = isRequiredOnDb || $isRequired;
</script>

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

<style lang="scss">
  .not-null-info {
    font-size: var(--sm1);
  }
</style>
