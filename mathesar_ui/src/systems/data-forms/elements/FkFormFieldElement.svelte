<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Select, Spinner } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';
  import {
    type EphermeralFkField,
    fkFieldInteractionRules,
  } from '../EphemeralDataForm';

  import DataFormFieldElement from './DataFormFieldElement.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ rule, linkedTableStructure, nestedFields } = dataFormField);
  $: isLinkedTableStructureLoading = linkedTableStructure.isLoading;

  const interactionRuleText = {
    must_create: {
      short: $_('form_fk_must_create_label'),
      help: $_('form_fk_must_create_help'),
    },
    select_or_create: {
      short: $_('form_fk_select_or_create_label'),
      help: $_('form_fk_select_or_create_help'),
    },
    only_select: {
      short: $_('form_fk_only_select_label'),
      help: $_('form_fk_only_select_help'),
    },
  };
</script>

<FormFieldElementWrapper {dataFormField} {dataFormManager} let:isSelected>
  {#if isSelected || $rule !== 'only_select'}
    <div class="allow-create">
      {#if $isLinkedTableStructureLoading}
        <Spinner />
      {/if}
    </div>
  {/if}

  <div class="fk-field">
    <DataFormLabel {dataFormField} {isSelected}>
      <Select
        triggerAppearance="secondary"
        options={fkFieldInteractionRules}
        value={$rule}
        on:change={(e) =>
          dataFormField.setInteractionRule(e.detail ?? 'only_select')}
        let:option
      >
        <div>
          <div>
            {option ? interactionRuleText[option].short : ''}
          </div>
          <div class="option-help">
            {option ? interactionRuleText[option].help : ''}
          </div>
        </div>

        <svelte:fragment slot="trigger" let:option={triggerOption}>
          {triggerOption ? interactionRuleText[triggerOption].short : ''}
        </svelte:fragment>
      </Select>
    </DataFormLabel>
    {#if $rule !== 'must_create'}
      <DataFormInput {dataFormField} {isSelected} />
    {/if}

    {#if $rule !== 'only_select'}
      {#each [...$nestedFields.values()] as nestedField (nestedField.key)}
        <DataFormFieldElement {dataFormManager} dataFormField={nestedField} />
      {/each}
    {/if}
  </div>
</FormFieldElementWrapper>

<style lang="scss">
  .fk-field {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .allow-create {
    --labeled-input-label-color: var(--accent-800);
    padding-bottom: 0.5rem;
  }
  .option-help {
    max-width: 25rem;
    white-space: normal;
    font-size: var(--sm1);
  }
</style>
