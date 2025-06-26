<script lang="ts">
  import { type DataFormManager } from './DataFormManager';
  import DataFormFieldElement from './elements/DataFormFieldElement.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';

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
    max-width: 60rem;
    background: var(--elevated-background);

    .form {
      min-width: 30rem;
      padding: var(--lg4) var(--lg5);

      .fields {
        margin-top: var(--sm2);
        display: flex;
        flex-direction: column;
        gap: var(--sm2);
      }
    }
  }
</style>
