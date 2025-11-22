<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Checkbox, Help, LabeledInput } from '@mathesar-component-library';

  import type { ColumnBasedDataFormField } from '../../data-form-utilities/fields';

  export let field: ColumnBasedDataFormField;
  $: ({ fieldColumn, isRequired } = field);
  $: isRequiredOnDb = !fieldColumn.column.nullable;
  $: isFieldRequired = isRequiredOnDb || $isRequired;
</script>

<LabeledInput layout="inline-input-first">
  <span slot="label">
    {$_('field_validation_mark_as_required')}

    {#if isRequiredOnDb}
      <Help>
        {$_('field_marked_required_column_disallows_null')}
      </Help>
    {/if}
  </span>

  <Checkbox
    checked={isFieldRequired}
    disabled={isRequiredOnDb}
    on:change={(e) => field.setIsRequired(e.detail)}
  />
</LabeledInput>
