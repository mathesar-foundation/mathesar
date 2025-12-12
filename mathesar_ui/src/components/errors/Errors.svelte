<script lang="ts">
  import { _ } from 'svelte-i18n';

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
  export let showFallbackError = false;

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

  {#if !errors.length && showFallbackError}
    <ErrorBox {fullWidth}>
      {$_('unknown_error')}
    </ErrorBox>
  {/if}
</div>

<style>
  .errors {
    display: grid;
    gap: var(--sm1);
  }
</style>
