<script lang="ts">
  import { sortableTrigger } from '@mathesar/components/sortable/sortable';
  import { iconGrip } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

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
    background: var(--elevated-background);
    padding-inline: var(--sm5);
    border-radius: var(--border-radius-m);
  }
</style>
