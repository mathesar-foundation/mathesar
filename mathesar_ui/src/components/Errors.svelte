<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  export let errors: string[];
  export let fullWidth = false;
</script>

{#if errors.length}
  <ErrorBox {fullWidth}>
    {#if errors.length === 1}
      {errors[0]}
    {:else}
      <ul class="list">
        <!-- Do not use a key here since
          -- error messages could be the same.
          -->
        {#each errors as error}
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
