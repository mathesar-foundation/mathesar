<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { LabelController } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { FkField } from '../data-form-utilities/fields';

  import DataFormFieldsContainer from './DataFormFieldsContainer.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';
  import FkFormFieldNestedFieldsHelp from './FkFormFieldNestedFieldsHelp.svelte';
  import FkFormFieldRuleSelector from './FkFormFieldRuleSelector.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: FkField;
  export let labelController: LabelController;

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;

  $: ({ interactionRule, nestedFields, fieldValueHolder } = dataFormField);
  $: ({ userAction } = fieldValueHolder);
  $: inputHasMargin = editableDataFormManager
    ? $interactionRule !== 'must_pick'
    : $userAction === 'create';
  $: inputProps = {
    dataFormManager,
    dataFormField,
    isSelected,
    labelController,
  };
</script>

<div class="fk-field">
  <div class="label-controls-container">
    <DataFormLabel {...inputProps}>
      {#if editableDataFormManager}
        <FkFormFieldRuleSelector
          dataFormManager={editableDataFormManager}
          {dataFormField}
        />
      {/if}
    </DataFormLabel>
  </div>

  {#if $interactionRule !== 'must_create'}
    <div class="fk-input" class:has-margin={inputHasMargin}>
      <DataFormInput
        {...inputProps}
        placeholder={$userAction === 'create'
          ? $_('adding_new_record')
          : undefined}
      />
    </div>
  {/if}

  {#if $interactionRule === 'can_pick_or_create' && editableDataFormManager}
    <FkFormFieldNestedFieldsHelp
      {dataFormField}
      dataFormManager={editableDataFormManager}
    />
  {/if}

  {#if $interactionRule !== 'must_pick' && (editableDataFormManager || $userAction === 'create')}
    <DataFormFieldsContainer fields={nestedFields} {dataFormManager} />
  {/if}
</div>

<style lang="scss">
  .fk-field {
    display: contents;
    --data-forms__field-padding-left: var(--lg2);

    .label-controls-container {
      margin-bottom: var(--df__internal__label-input-gap);
    }
    .fk-input.has-margin {
      margin-bottom: var(--df__internal__element-spacing);
    }
  }
</style>
