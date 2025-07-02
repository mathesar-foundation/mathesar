<script lang="ts">
  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import EditableFormFieldElementWrapper from './EditableFormFieldElementWrapper.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

{#if dataFormManager instanceof EditableDataFormManager}
  <EditableFormFieldElementWrapper
    {dataFormManager}
    {dataFormField}
    let:isSelected
  >
    <slot {isSelected} />
  </EditableFormFieldElementWrapper>
{:else}
  <slot isSelected={false} />
{/if}
