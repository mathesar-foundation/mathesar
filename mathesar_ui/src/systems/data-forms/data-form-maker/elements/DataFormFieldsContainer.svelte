<script lang="ts">
  import type { ParentEphemeralField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';
  import type { FormFields } from '../../data-form-utilities/FormFields';

  import { AddField } from './add-field';
  import DataFormFieldElement from './DataFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let parentField: ParentEphemeralField;
  export let fields: FormFields;
</script>

<div class="fields-container">
  {#each $fields as ephField (ephField.key)}
    <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
  {:else}
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="empty-fields-state">
        <AddField
          display="full"
          {dataFormManager}
          {parentField}
          insertionIndex={$fields.length}
        />
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .fields-container {
    display: contents;

    .empty-fields-state {
      padding: var(--lg1);
      margin-bottom: var(--sm4);
      border: 1px dashed var(--border-color);
    }
  }
</style>
