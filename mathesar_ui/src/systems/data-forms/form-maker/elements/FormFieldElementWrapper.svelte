<script lang="ts">
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/FormFields';

  import { AddField } from './add-field';
  import FormFieldSource from './FormFieldSource.svelte';
  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: DataFormField;

  $: ({ index } = dataFormField);
</script>

<SelectableElement
  element={{
    type: 'field',
    field: dataFormField,
  }}
  {dataFormManager}
  let:isSelected
>
  <svelte:fragment slot="header">
    {#if dataFormManager instanceof EditableDataFormManager}
      <FormFieldSource {dataFormManager} {dataFormField} />
    {/if}
  </svelte:fragment>

  <slot {isSelected} />

  <svelte:fragment slot="footer">
    {#if dataFormManager instanceof EditableDataFormManager}
      <AddField
        {dataFormManager}
        fieldHolder={dataFormField.holder}
        insertionIndex={$index + 1}
      />
    {/if}
  </svelte:fragment>
</SelectableElement>
