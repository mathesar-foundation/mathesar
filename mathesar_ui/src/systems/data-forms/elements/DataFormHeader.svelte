<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { DataFormManager } from '../DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;

  $: ({ name } = dataFormManager.ephemeralDataForm);

  function getInputValue(e: Event) {
    const element = e.target as HTMLInputElement;
    return element.value;
  }

  async function onTitleInput(e: Event) {
    await dataFormManager.update((edf) => edf.setName(getInputValue(e)));
  }
</script>

<div class="header">
  <SelectableElement elementId="title" {dataFormManager}>
    <input
      class="form-title"
      type="text"
      placeholder={$_('add_form_title')}
      value={$name}
      on:input={onTitleInput}
    />
  </SelectableElement>

  <SelectableElement elementId="description" {dataFormManager}>
    <textarea
      placeholder={$_('add_form_description')}
      class="form-description"
      type="text"
    />
  </SelectableElement>
</div>

<style lang="scss">
  .header {
    --data_forms__selectable-element-padding: 0;
  }

  input,
  textarea {
    border: none;
    background: transparent;
    width: 100%;

    &:not(:focus) {
      cursor: pointer;
    }
  }
  .form-title {
    border: none;
    padding: var(--sm1);
    font-size: var(--lg3);
    font-weight: var(--font-weight-medium);
  }
  .form-description {
    padding: var(--sm3) var(--sm1);
    resize: vertical;
    height: 3rem;
  }
</style>
