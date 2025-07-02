<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DataFormTitle from '../../data-form-components/DataFormTitle.svelte';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;

  $: ({ name } = dataFormManager.ephemeralDataForm);

  async function onTitleInput(_name: string) {
    if (dataFormManager instanceof EditableDataFormManager) {
      await dataFormManager.update((edf) => edf.setName(_name));
    }
  }
</script>

<div class="header">
  <SelectableElement elementId="title" {dataFormManager} let:isSelected>
    <DataFormTitle isEditable {isSelected} title={$name} {onTitleInput} />
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

  textarea {
    border: none;
    background: transparent;
    width: 100%;

    &:not(:focus) {
      cursor: pointer;
    }
  }

  .form-description {
    padding: var(--sm3) var(--sm1);
    resize: vertical;
    height: 3rem;
  }
</style>
