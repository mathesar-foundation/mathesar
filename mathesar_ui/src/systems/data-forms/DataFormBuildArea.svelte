<script lang="ts">
  import DataFormBranding from './DataFormBranding.svelte';
  import { type DataFormManager } from './DataFormManager';
  import DataFormFieldElement from './elements/DataFormFieldElement.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';
  import DataFormSubmitButtons from './elements/DataFormSubmitButtons.svelte';

  export let dataFormManager: DataFormManager;
  $: ({ fields } = dataFormManager.ephemeralDataForm);

  function handleFormSelection(e: MouseEvent) {
    const { target } = e;
    if (target instanceof HTMLElement) {
      if (!target.closest('[data-form-selectable]')) {
        dataFormManager.selectElement('form');
      }
    }
  }
</script>

<div class="build-area" on:click={handleFormSelection}>
  <div class="form">
    <DataFormHeader {dataFormManager} />
    <div class="fields">
      {#each [...$fields.values()] as ephField (ephField.key)}
        <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
      {/each}
    </div>
    <DataFormSubmitButtons {dataFormManager} />
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

    .form {
      min-width: 30rem;
      padding: var(--lg4) var(--lg5);
      display: flex;
      flex-direction: column;
      gap: var(--sm2);

      .fields {
        display: flex;
        flex-direction: column;
        gap: var(--sm2);
      }

      .branding {
        border-top: 1px solid var(--border-color);
        margin-top: var(--lg2);
      }
    }
  }
</style>
