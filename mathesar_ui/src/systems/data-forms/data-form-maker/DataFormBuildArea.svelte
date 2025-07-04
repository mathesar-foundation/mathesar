<script lang="ts">
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  import DataFormBranding from './DataFormBranding.svelte';
  import DataFormFieldsContainer from './elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from './elements/DataFormFooter.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';

  export let dataFormManager: DataFormManager;
  $: ({ fields } = dataFormManager.ephemeralDataForm);

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
    <DataFormFieldsContainer {fields} parentField={null} {dataFormManager} />
    <DataFormFooter />
    <div class="branding">
      <DataFormBranding />
    </div>
  </div>
</div>

<style lang="scss">
  .build-area {
    overflow: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-l);
    width: calc(100% - 3rem);
    position: relative;
    margin: 0 auto;
    height: 100%;
    max-height: fit-content;
    max-width: 60rem;
    background: var(--elevated-background);
    --z-index__data_forms__field-header: 1;
    --z-index__data_forms__field-add-dropdown-trigger: 2;
    --data_forms__label-input-gap: 0.5rem;
    --data_forms__selectable-element-padding: 1rem;

    .form {
      min-width: 30rem;
      padding: var(--lg4) var(--lg5);
      display: flex;
      flex-direction: column;

      .branding {
        border-top: 1px solid var(--border-color);
        margin-top: var(--lg2);
      }
    }
  }
</style>
