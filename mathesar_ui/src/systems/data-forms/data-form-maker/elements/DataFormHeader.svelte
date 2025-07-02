<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;

  $: ({ name, description } = dataFormManager.ephemeralDataForm);

  function getInputValue(e: Event) {
    const element = e.target as HTMLInputElement;
    return element.value;
  }

  async function onTitleInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedName = getInputValue(e);
      await dataFormManager.update((edf) => edf.setName(updatedName));
    }
  }

  async function onSubtitleInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedDesc = getInputValue(e);
      await dataFormManager.update((edf) => edf.setDescription(updatedDesc));
    }
  }
</script>

<div class="header">
  <SelectableElement elementId="title" {dataFormManager}>
    {#if dataFormManager instanceof EditableDataFormManager}
      <input
        class="form-title"
        type="text"
        placeholder={$_('add_form_title')}
        value={$name}
        on:input={onTitleInput}
      />
    {:else}
      <h1 class="form-title">
        {$name}
      </h1>
    {/if}
  </SelectableElement>

  <SelectableElement elementId="description" {dataFormManager}>
    {#if dataFormManager instanceof EditableDataFormManager}
      <textarea
        placeholder={$_('add_form_description')}
        class="form-description"
        type="text"
        value={$description}
        on:input={onSubtitleInput}
      />
    {:else if $description}
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
