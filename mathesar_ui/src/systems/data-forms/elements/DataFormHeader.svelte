<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;

  $: ({ ephemeralDataForm } = dataFormManager);
  $: ({ headerTitle, headerSubTitle } = ephemeralDataForm);

  function getInputValue(e: Event) {
    const element = e.target as HTMLInputElement;
    return element.value;
  }

  function onTitleInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedName = getInputValue(e);
      ephemeralDataForm.setHeaderTitle(updatedName);
    }
  }

  function onSubtitleInput(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const updatedDesc = getInputValue(e);
      ephemeralDataForm.setHeaderSubTitle(updatedDesc);
    }
  }
</script>

<div class="header">
  <SelectableElement
    element={{
      type: 'title',
    }}
    {dataFormManager}
  >
    {#if dataFormManager instanceof EditableDataFormManager}
      <input
        class="form-title"
        type="text"
        placeholder={$_('add_form_title')}
        value={$headerTitle.text}
        on:input={onTitleInput}
      />
    {:else}
      <h1 class="form-title">
        {$headerTitle.text}
      </h1>
    {/if}
  </SelectableElement>

  <SelectableElement element={{ type: 'subtitle' }} {dataFormManager}>
    {#if dataFormManager instanceof EditableDataFormManager}
      <textarea
        placeholder={$_('add_form_subtitle')}
        class="form-description"
        type="text"
        value={$headerSubTitle?.text}
        on:input={onSubtitleInput}
      />
    {:else if $headerSubTitle?.text}
      <div class="form-description">
        {$headerSubTitle.text}
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
