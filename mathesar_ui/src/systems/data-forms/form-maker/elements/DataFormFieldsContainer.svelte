<script lang="ts">
  import { get } from 'svelte/store';

  import { sortableContainer } from '@mathesar/components/sortable/sortable';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { FormFields } from '../data-form-utilities/fields';

  import { AddField } from './add-field';
  import DataFormFieldElement from './DataFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let fields: FormFields;
</script>

<div
  class="fields-container"
  use:sortableContainer={{
    getItems: () => [...get(fields)],
    onSort: (orderedFields) => fields.rearrange(orderedFields),
  }}
>
  {#each $fields as ephField (ephField.key)}
    <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
  {:else}
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="empty-fields-state">
        <AddField
          display="full"
          {dataFormManager}
          fieldHolder={fields}
          insertionIndex={$fields.length}
        />
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .fields-container {
    --df__internal__selectable-elem-padding: var(
        --df__internal__element-spacing
      )
      var(--df__internal_element-right-padding)
      var(--df__internal__element-spacing)
      var(--df__internal_element-left-padding);
  }
  .empty-fields-state {
    margin: 1rem;
    padding: var(--lg1);
    margin-bottom: var(--sm4);
    border: 1px dashed var(--color-border-section);
    border-radius: var(--border-radius-l);
  }
</style>
