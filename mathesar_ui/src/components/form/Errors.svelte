<script lang="ts">
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';

  export let errors: string[];
</script>

{#if errors.length}
  <ErrorBox>
    {#if errors.length === 1}
      {errors[0]}
    {:else}
      <ul class="list">
        {#each errors as error (error)}
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
