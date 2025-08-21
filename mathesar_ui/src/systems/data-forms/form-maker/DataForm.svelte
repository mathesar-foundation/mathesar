<script lang="ts">
  import { type DataFormManager } from './data-form-utilities/DataFormManager';
  import DataFormBranding from './DataFormBranding.svelte';
  import DataFormFieldsContainer from './elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from './elements/DataFormFooter.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';

  export let dataFormManager: DataFormManager;
  export let showBranding = true;

  $: ({ fields } = dataFormManager.dataFormStructure);
</script>

<div class="form">
  <DataFormHeader {dataFormManager} />
  <DataFormFieldsContainer {fields} {dataFormManager} />
  <DataFormFooter {dataFormManager} />
  {#if showBranding}
    <div class="branding">
      <DataFormBranding />
    </div>
  {/if}
</div>

<style lang="scss">
  .form {
    --df__internal__element-spacing: var(--df__element-spacing, var(--sm3));

    --df__internal_element-left-padding: var(
      --df__element-left-padding,
      var(--df__internal__element-spacing)
    );
    --df__internal_element-right-padding: var(
      --df__element-right-padding,
      var(--df__internal__element-spacing)
    );

    --df__internal__label-input-gap: calc(
      var(--df__internal__element-spacing) / 2
    );
    --df__internal__z-index__field-header: 1;

    min-width: 25rem;
    max-width: var(--df__max-width, 40rem);
    margin: var(--df__margin, 0 auto);

    /** form padding offsets based on element padding */
    padding: var(
      --df__padding,
      var(--lg1) var(--df__internal_element-left-padding) var(--lg1)
        var(--df__internal_element-right-padding)
    );
    display: flex;
    flex-direction: column;

    .branding {
      border-top: 1px solid var(--border-color);
      margin-top: var(--lg2);
    }
  }
</style>
