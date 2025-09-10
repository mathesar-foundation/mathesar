<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconRefresh } from '@mathesar/icons';
  import { Button, Icon, iconError } from '@mathesar-component-library';

  export let state: 'loading' | 'error' | undefined = undefined;

  $: isLoading = state === 'loading';
  $: isError = state === 'error';
</script>

<div class="refresh-button">
  <Button appearance="custom" size="medium" disabled={isLoading} on:click>
    <Icon
      {...isError && !isLoading ? iconError : iconRefresh}
      spin={isLoading}
    />
    <span>
      {#if isLoading}
        {$_('loading')}
      {:else if isError}
        {$_('retry')}
      {:else}
        {$_('refresh')}
      {/if}
    </span>
  </Button>
</div>

<style lang="scss">
  .refresh-button {
    --button-background: var(--color-highlight-c-20);
    --button-border-color: var(--color-highlight-c-20);
    --button-color: var(--color-fg-control);

    --button-hover-background: var(--color-highlight-c-40-hover);
    --button-hover-border-color: var(--color-highlight-c-40-hover);
    --button-hover-color: var(--color-fg-control-hover);

    --button-active-background: var(--color-highlight-c-40-active);
    --button-active-border-color: var(--color-highlight-c-40-active);
    --button-active-color: var(--color-fg-control-active);
  }
</style>
