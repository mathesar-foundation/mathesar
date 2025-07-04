<script lang="ts">
  import type { EphemeralDataFormField } from '../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  import { AddField } from './add-field';
  import FormFieldSource from './FormFieldSource.svelte';
  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;

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
        parentField={dataFormField.parentField}
        insertionIndex={$index + 1}
      />
    {/if}
  </svelte:fragment>
</SelectableElement>
