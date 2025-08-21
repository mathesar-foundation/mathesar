<script lang="ts">
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from './data-form-utilities/DataFormManager';
  import DataFormFieldsContainer from './elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from './elements/DataFormFooter.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';

  export let dataFormManager: DataFormManager;
  $: ({ fields } = dataFormManager.dataFormStructure);

  function handleFormSelection(e: MouseEvent) {
    if (dataFormManager instanceof EditableDataFormManager) {
      const { target } = e;
      if (target instanceof HTMLElement) {
        if (!target.closest('[data-form-selectable]')) {
          dataFormManager.resetSelectedElement();
        }
      }
    }
  }
</script>

<div class="build-area" on:click={handleFormSelection}>
  <div class="form">
    <DataFormHeader {dataFormManager} />
    <DataFormFieldsContainer {fields} {dataFormManager} />
    <DataFormFooter {dataFormManager} />
  </div>
</div>

<style lang="scss">
  .build-area {
    overflow: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-l);
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--elevated-background);
    --data_forms__z-index__field-header: 1;
    --data_forms__z-index__field-add-dropdown-trigger: 2;
    --data_forms__label-input-gap: 0.5rem;
    --data_forms__selectable-element-padding: 1rem;

    .form {
      min-width: 25rem;
      max-width: calc(60rem + var(--lg1));
      margin: var(--lg2) auto;
      padding: 0 var(--lg1);
      display: flex;
      flex-direction: column;
    }
  }
</style>
