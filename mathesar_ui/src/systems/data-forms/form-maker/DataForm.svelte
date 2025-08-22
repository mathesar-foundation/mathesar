<script lang="ts">
  import { ensureReadable } from '@mathesar/component-library';

  import {
    DataFormFillOutManager,
    type DataFormManager,
  } from './data-form-utilities/DataFormManager';
  import DataFormBranding from './DataFormBranding.svelte';
  import DataFormFieldsContainer from './elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from './elements/DataFormFooter.svelte';
  import DataFormHeader from './elements/DataFormHeader.svelte';
  import PostSubmission from './PostSubmission.svelte';

  export let dataFormManager: DataFormManager;
  export let showBranding = true;

  $: ({ fields } = dataFormManager.dataFormStructure);
  $: dataFormFillOutManager =
    dataFormManager instanceof DataFormFillOutManager
      ? dataFormManager
      : undefined;
  $: isSubmitted = ensureReadable(
    dataFormFillOutManager?.isSuccessfullySubmitted,
  );
</script>

<form class="data-form">
  {#if dataFormFillOutManager && $isSubmitted}
    <PostSubmission dataFormManager={dataFormFillOutManager} />
  {:else}
    <DataFormHeader {dataFormManager} />
    <DataFormFieldsContainer {fields} {dataFormManager} />
    <DataFormFooter {dataFormManager} />
  {/if}
  {#if showBranding}
    <div class="branding">
      <DataFormBranding />
    </div>
  {/if}
</form>

<style lang="scss">
  .data-form {
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
    --df__internal__z-index__field-with-some-selected-child: 1;
    --df__internal__z-index__field-outer-controls: 2;
    --df__internal__z-index__field-being-dragged: 3;
    --df__internal__selected-element-bg: var(
      --df__selected-element-bg,
      var(--accent-100)
    );
    --df__internal__selected-element-border-color: var(
      --df__selected-element-border-color,
      var(--accent-500)
    );
    --df__internal__help-text-color: var(
      --df__help-text-color,
      var(--stormy-700)
    );
    --df__internal__some-child-selected-border-color: var(
      --df-some-child-selected-border-color,
      var(--accent-300)
    );
    --df__internal__immediate-child-selected-border-color: var(
      --df-immediate-child-selected-border-color,
      var(--accent-500)
    );

    min-width: 15rem;
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

  :global(body.theme-dark) .data-form {
    --df__selected-element-bg: rgba(239, 68, 68, 0.12);
    --df__selected-element-border-color: var(--salmon-300);
    --df-immediate-child-selected-border-color: rgba(255, 179, 148, 0.45);
    --df-some-child-selected-border-color: rgba(255, 179, 148, 0.3);
    --df__help-text-color: var(--rosy-100);
  }
</style>
