<script lang="ts">
  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import AddFormFieldElementDropdown from './AddFormFieldElementDropdown.svelte';
  import FormFieldSource from './FormFieldSource.svelte';
  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;

  $: ({ ephemeralDataForm } = dataFormManager);

  $: tableOidOfField = dataFormField.parentField
    ? dataFormField.parentField.relatedTableOid
    : ephemeralDataForm.baseTableOid;
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
      <FormFieldSource {dataFormManager} {dataFormField} {tableOidOfField} />
    {/if}
  </svelte:fragment>

  <slot {isSelected} />

  <svelte:fragment slot="footer">
    {#if dataFormManager instanceof EditableDataFormManager}
      <AddFormFieldElementDropdown
        tableOid={tableOidOfField}
        {dataFormManager}
      />
    {/if}
  </svelte:fragment>
</SelectableElement>
