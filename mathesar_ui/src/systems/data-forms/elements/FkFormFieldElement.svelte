<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Checkbox, LabeledInput, Spinner } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';
  import type { EphermeralFkField } from '../EphemeralDataForm';

  import DataFormFieldElement from './DataFormFieldElement.svelte';
  import DataFormInput from './DataFormInput.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralFkField;

  $: ({ allowCreate, linkedTableStructure, nestedFields } = dataFormField);
  $: isLinkedTableStructureLoading = linkedTableStructure.isLoading;
</script>

<FormFieldElementWrapper {dataFormField} {dataFormManager} let:isSelected>
  <div class="fk-field">
    <DataFormInput {dataFormManager} {dataFormField} {isSelected} />

    {#if isSelected || $allowCreate}
      <div class="allow-create">
        <LabeledInput
          layout="inline-input-first"
          label={$_('form_fk_field_allow_adding_new_records')}
        >
          <Checkbox
            checked={$allowCreate}
            on:change={(e) => dataFormField.setAllowCreate(e.detail)}
          />
        </LabeledInput>
        {#if $allowCreate && $isLinkedTableStructureLoading}
          <Spinner />
        {/if}
      </div>
    {/if}

    {#each [...$nestedFields.values()] as nestedField (nestedField.key)}
      <DataFormFieldElement {dataFormManager} dataFormField={nestedField} />
    {/each}
  </div>
</FormFieldElementWrapper>

<style lang="scss">
  .fk-field {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
  }
  .allow-create {
    --labeled-input-label-color: var(--accent-800);
    padding-bottom: 0.5rem;
  }
</style>
