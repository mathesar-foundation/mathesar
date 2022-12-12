<script lang="ts">
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
      Loading
    {:else if isError}
      Retry
    {:else}
      Refresh
    {/if}
  </span>
</Button>
