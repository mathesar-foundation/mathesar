<script lang="ts">
  import RenderComponentWithProps from '@mathesar/component-library/render/RenderComponentWithProps.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  import ErrorList from './ErrorList.svelte';
  import {
    type GeneralizedError,
    getDistinctErrors,
    groupErrors,
  } from './errorUtils';

  export let errors: GeneralizedError[];
  export let fullWidth = false;

  $: ({ stringErrors, richErrors } = groupErrors(getDistinctErrors(errors)));
</script>

<div class="errors">
  {#each richErrors as richError}
    <ErrorBox {fullWidth}>
      <RenderComponentWithProps componentWithProps={richError} />
    </ErrorBox>
  {/each}

  {#if stringErrors.length}
    <ErrorBox {fullWidth}>
      <ErrorList errorStrings={stringErrors} />
    </ErrorBox>
  {/if}
</div>

<style>
  .errors {
    display: grid;
    gap: var(--size-small);
  }
</style>
