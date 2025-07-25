<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Button } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';

  import DataFormFieldsContainer from './DataFormFieldsContainer.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';
  import FkFormFieldNestedFieldsHelp from './FkFormFieldNestedFieldsHelp.svelte';
  import FkFormFieldRuleSelector from './FkFormFieldRuleSelector.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralFkField;

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;

  $: ({ interactionRule, nestedFields, fieldValueHolder } = dataFormField);
  $: ({ userAction } = fieldValueHolder);
</script>

<div class="fk-field">
  <div class="label-controls-container">
    <DataFormLabel {dataFormManager} {dataFormField} {isSelected}>
      {#if editableDataFormManager}
        <FkFormFieldRuleSelector
          dataFormManager={editableDataFormManager}
          {dataFormField}
        />
      {/if}
    </DataFormLabel>
  </div>

  {#if $interactionRule !== 'must_create'}
    <div class="fk-input" class:has-margin={$interactionRule !== 'must_pick'}>
      {#if editableDataFormManager || $interactionRule === 'must_pick' || $userAction === 'pick'}
        <DataFormInput {dataFormField} {isSelected} />
      {/if}

      {#if $interactionRule === 'can_pick_or_create'}
        {#if $userAction === 'pick'}
          <!-- TODO_FORMS: Place this within Row Seeker -->
          <Button on:click={() => fieldValueHolder.setUserAction('create')}>
            {$_('create_record_TODO_place_within_row_seeker')}
          </Button>
        {:else}
          <Button on:click={() => fieldValueHolder.setUserAction('pick')}>
            {$_(
              'enter_values_below_or_click_here_to_pick_record_TODO_place_within_row_seeker',
            )}
          </Button>
        {/if}
      {/if}
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
      margin-bottom: var(--data_forms__label-input-gap);
    }
    .fk-input.has-margin {
      margin-bottom: var(--data_forms__selectable-element-padding);
    }
  }
</style>
