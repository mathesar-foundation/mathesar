<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';
  import type { EphermeralFkField } from '../../data-form-utilities/EphemeralFkField';

  import DataFormFieldsContainer from './DataFormFieldsContainer.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';
  import FkFormFieldNestedFieldsHelp from './FkFormFieldNestedFieldsHelp.svelte';
  import FkFormFieldRuleSelector from './FkFormFieldRuleSelector.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ interactionRule, relatedTableOid, nestedFields } = dataFormField);
</script>

<div class="fk-field">
  <div class="label-controls-container">
    <DataFormLabel {dataFormManager} {dataFormField} {isSelected}>
      {#if dataFormManager instanceof EditableDataFormManager}
        <FkFormFieldRuleSelector {dataFormManager} {dataFormField} />
      {/if}
    </DataFormLabel>
  </div>

  {#if $interactionRule !== 'must_create'}
    <div class="fk-input" class:has-margin={$interactionRule !== 'must_pick'}>
      <DataFormInput {dataFormField} {isSelected} />
    </div>
  {/if}

  {#if $interactionRule === 'can_pick_or_create' && dataFormManager instanceof EditableDataFormManager}
    <FkFormFieldNestedFieldsHelp {dataFormField} {dataFormManager} />
  {/if}

  {#if $interactionRule !== 'must_pick'}
    <DataFormFieldsContainer
      tableOid={relatedTableOid}
      fields={nestedFields}
      {dataFormManager}
    />
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
