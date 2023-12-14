<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Button, Icon, iconError } from '@mathesar-component-library';
  import { iconRefresh } from '@mathesar/icons';

  export let state: 'loading' | 'error' | undefined = undefined;

  $: isLoading = state === 'loading';
  $: isError = state === 'error';
</script>

<Button
  class="refresh-button"
  appearance="secondary"
  size="medium"
  disabled={isLoading}
  on:click
>
  <Icon {...isError && !isLoading ? iconError : iconRefresh} spin={isLoading} />
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
