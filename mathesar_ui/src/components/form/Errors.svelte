<script lang="ts">
  import { Alert } from '@mathesar-component-library';

  export let errors: string[];
</script>

{#if errors.length}
  <div class="errors">
    <Alert appearance="error">
      {#if errors.length === 1}
        {errors[0]}
      {:else}
        <ul class="list">
          {#each errors as error (error)}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}
    </Alert>
  </div>
{/if}

<style>
  .errors {
    font-size: var(--text-size-small);
  }
  .list {
    margin: 0;
    padding-left: 1.5rem;
  }
</style>
