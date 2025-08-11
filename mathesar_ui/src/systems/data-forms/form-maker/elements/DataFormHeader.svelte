<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getStringValueFromEvent } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;

  $: ({ dataFormStructure } = dataFormManager);
  $: ({ name, description } = dataFormStructure);

  function onNameInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedName = getStringValueFromEvent(e);
      dataFormStructure.setName(updatedName);
    }
  }

  function onDescriptionInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedDesc = getStringValueFromEvent(e);
      dataFormStructure.setDescription(updatedDesc);
    }
  }
</script>

<div class="header">
  <SelectableElement
    element={{
      type: 'name',
    }}
    {dataFormManager}
  >
    {#if dataFormManager instanceof EditableDataFormManager}
      <input
        class="form-title"
        type="text"
        placeholder={$_('name')}
        value={$name}
        on:input={onNameInput}
      />
    {:else if $name.trim()}
      <h1 class="form-title">
        {$name}
      </h1>
    {/if}
  </SelectableElement>

  <SelectableElement element={{ type: 'description' }} {dataFormManager}>
    {#if dataFormManager instanceof EditableDataFormManager}
      <textarea
        placeholder={$_('description')}
        class="form-description"
        type="text"
        value={$description ?? ''}
        on:input={onDescriptionInput}
      />
    {:else if $description?.trim()}
      <div class="form-description">
        {$description}
      </div>
    {/if}
  </SelectableElement>
</div>

<style lang="scss">
  .header {
    --data_forms__selectable-element-padding: 0;
  }

  .form-title {
    border: none;
    padding: var(--sm1);
    font-size: var(--lg3);
    font-weight: var(--font-weight-medium);
    background: transparent;
    width: 100%;
    margin: 0;
    line-height: 1.5;
    letter-spacing: var(--letter-spacing-base);
  }

  input.form-title {
    &:not(:focus) {
      cursor: pointer;
    }
  }

  .form-description {
    padding: var(--sm3) var(--sm1);
    margin: 0;
  }
  div.form-description {
    white-space: pre;
  }
  textarea.form-description {
    resize: vertical;
    min-height: 4rem;
    border: none;
    background: transparent;
    width: 100%;

    &:not(:focus) {
      cursor: pointer;
    }
  }
</style>
