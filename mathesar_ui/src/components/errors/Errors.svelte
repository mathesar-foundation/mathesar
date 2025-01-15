<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';

  export let errors: (string | RpcError)[];
  export let fullWidth = false;

  $: errorStrings = errors.map((err) =>
    err instanceof RpcError ? err.message : err,
  );
</script>

{#if errorStrings.length}
  <ErrorBox {fullWidth}>
    {#if errorStrings.length === 1}
      {errorStrings[0]}
    {:else}
      <ul class="list">
        <!-- Do not use a key here since
          -- error messages could be the same.
          -->
        {#each errorStrings as error}
          <li>{error}</li>
        {/each}
      </ul>
    {/if}
  </ErrorBox>
{/if}

<style>
  .list {
    margin: 0;
    padding-left: 1.5rem;
  }
</style>
