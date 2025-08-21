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
  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;
  $: showName = !!editableDataFormManager || $name.trim();
  $: showDescription = !!editableDataFormManager || $description?.trim();

  function onNameInput(e: Event) {
    if (editableDataFormManager) {
      const updatedName = getStringValueFromEvent(e);
      dataFormStructure.setName(updatedName);
    }
  }

  function onDescriptionInput(e: Event) {
    if (editableDataFormManager) {
      const updatedDesc = getStringValueFromEvent(e);
      dataFormStructure.setDescription(updatedDesc);
    }
  }
</script>

<div class="header">
  {#if showName}
    <div class="title-container">
      <SelectableElement
        element={{
          type: 'name',
        }}
        {dataFormManager}
      >
        {#if editableDataFormManager}
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
    </div>
  {/if}

  {#if showDescription}
    <div class="desc-container">
      <SelectableElement element={{ type: 'description' }} {dataFormManager}>
        {#if editableDataFormManager}
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
  {/if}
</div>

<style lang="scss">
  .header {
    .title-container {
      --df__internal_header-v-spacing: calc(
        var(--df__internal__element-spacing) * 0.8
      );

      --df__internal__selectable-elem-padding: var(
          --df__internal_header-v-spacing
        )
        var(--df__internal_element-right-padding)
        var(--df__internal_header-v-spacing)
        var(--df__internal_element-left-padding);
    }
    .desc-container {
      --df__internal_desc-v-spacing: calc(
        var(--df__internal__element-spacing) * 0.5
      );

      --df__internal__selectable-elem-padding: var(
          --df__internal_desc-v-spacing
        )
        var(--df__internal_element-right-padding)
        var(--df__internal_desc-v-spacing)
        var(--df__internal_element-left-padding);
    }
  }

  .form-title {
    border: none;
    padding: 0;
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
    padding: 0;
    margin: 0;
  }
  div.form-description {
    white-space: pre-wrap;
    margin-bottom: var(--sm4);
  }
  textarea.form-description {
    resize: vertical;
    min-height: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    width: 100%;

    &:not(:focus) {
      cursor: pointer;
    }
  }
</style>
