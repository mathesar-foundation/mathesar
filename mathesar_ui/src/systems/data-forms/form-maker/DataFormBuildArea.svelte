<script lang="ts">
  import { type DataFormManager } from './data-form-utilities/DataFormManager';
  import DataFormFieldsContainer from './elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from './elements/DataFormFooter.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';

  export let dataFormManager: DataFormManager;
  $: ({ fields } = dataFormManager.dataFormStructure);
</script>

<div class="form">
  <DataFormHeader {dataFormManager} />
  <DataFormFieldsContainer {fields} {dataFormManager} />
  <DataFormFooter {dataFormManager} />
</div>

<style lang="scss">
  .form {
    min-width: 25rem;
    max-width: calc(60rem + var(--lg1));
    margin: var(--lg2) auto;
    padding: 0 var(--lg1);
    display: flex;
    flex-direction: column;
  }
</style>
