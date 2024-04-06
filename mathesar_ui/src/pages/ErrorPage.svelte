<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { AnchorButton } from '@mathesar-component-library';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';

  export let showGoToRoot = true;
</script>

<LayoutWithHeader>
  <div class="error-page-container">
    <h1>{$_('error')}</h1>
    <div>
      <slot />
    </div>
    {#if showGoToRoot}
      <AnchorButton appearance="primary" href="/">
        {$_('go_to_homepage')}
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
