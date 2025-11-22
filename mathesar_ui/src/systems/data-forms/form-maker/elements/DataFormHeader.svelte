<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GrowableTextArea from '@mathesar/components/GrowableTextArea.svelte';
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

  async function checkAndSetDefaultFormName() {
    if (editableDataFormManager) {
      await editableDataFormManager.checkAndSetDefaultFormName();
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
            on:blur={checkAndSetDefaultFormName}
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
          <div class="form-description">
            <GrowableTextArea
              placeholder={$_('description')}
              type="text"
              value={$description ?? ''}
              on:input={onDescriptionInput}
            />
          </div>
        {:else if $description?.trim()}
          <div class="form-description-static">
            {$description}
          </div>
        {/if}
      </SelectableElement>
    </div>
  {/if}
</div>

<style lang="scss">
  .header {
    --df__internal__selectable-elem-padding: 0;

    .title-container {
      --df__internal_title-v-spacing: calc(
        var(--df__internal__element-spacing) * 0.8
      );

      --df__internal_title-padding: var(--df__internal_title-v-spacing)
        var(--df__internal_element-right-padding)
        var(--df__internal_title-v-spacing)
        var(--df__internal_element-left-padding);
    }
    .desc-container {
      --df__internal_desc-v-spacing: calc(
        var(--df__internal__element-spacing) * 0.5
      );

      --df__internal_desc-padding: var(--df__internal_desc-v-spacing)
        var(--df__internal_element-right-padding)
        var(--df__internal_desc-v-spacing)
        var(--df__internal_element-left-padding);
    }
  }

  .form-title {
    border: none;
    padding: var(--df__internal_title-padding);
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

  div.form-description-static {
    white-space: pre-wrap;
    margin-bottom: var(--sm4);
    padding: var(--df__internal_desc-padding);
  }
  div.form-description {
    resize: vertical;
    --text-area-min-height: 2.2rem;
    --input-element-border: none;
    --input-focus-color: none;
    --input-element-focus-box-shadow: none;
    --input-element-background: none;
    --input-padding: var(--df__internal_desc-padding);
    background: transparent;
    width: 100%;

    &:not(:focus) {
      cursor: pointer;
    }
  }
</style>
