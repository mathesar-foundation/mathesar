<script lang="ts">
  import { sortableTrigger } from '@mathesar/components/sortable/sortable';
  import { iconGrip } from '@mathesar/icons';
  import { Icon, LabelController } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  import { AddField } from './add-field';
  import FormFieldSource from './FormFieldSource.svelte';
  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: DataFormField;

  $: labelController = new LabelController(dataFormField.key);
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
      <div class="source-info">
        <FormFieldSource {dataFormManager} {dataFormField} />
      </div>
    {/if}
  </svelte:fragment>

  <slot
    fieldElementProps={{
      isSelected,
      labelController,
    }}
  />

  <svelte:fragment slot="footer">
    {#if dataFormManager instanceof EditableDataFormManager}
      <AddField
        {dataFormManager}
        fieldHolder={dataFormField.container}
        insertionIndex={$index + 1}
      />
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="left">
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="grip" use:sortableTrigger>
        <Icon {...iconGrip} />
      </div>
    {/if}
  </svelte:fragment>
</SelectableElement>

<style>
  .grip {
    background: var(--color-surface-raised-2);
    padding-inline: var(--sm5);
    border-radius: var(--border-radius-m);
  }
  .source-info {
    --df__internal__field-source-font-size: var(--sm2);
    --df__internal__field-source-max-width: 8rem;
  }
</style>
