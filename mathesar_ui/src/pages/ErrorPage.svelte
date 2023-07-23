<script lang="ts">
  import { AnchorButton } from '@mathesar/component-library';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let showGoToRoot = true;
</script>

<LayoutWithHeader>
  <div class="error-page-container">
    <h1>{$LL.general.error()}</h1>
    <div>
      <slot />
    </div>
    {#if showGoToRoot}
      <AnchorButton appearance="primary" href="/">
        {$LL.general.goToHomepage()}
      </AnchorButton>
    {/if}
  </div>
</LayoutWithHeader>

<style lang="scss">
  .error-page-container {
    margin-top: var(--size-x-large);
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    > :global(* + *) {
      margin-top: var(--size-small);
    }
  }
</style>
