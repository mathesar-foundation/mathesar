<script lang="ts">
  export let errorStrings: string[];

  $: uniqueErrors = [...new Set(errorStrings)];
</script>

{#if uniqueErrors.length === 1}
  <p>{uniqueErrors[0]}</p>
{:else}
  <ul class="list">
    {#each uniqueErrors as error (error)}
      <li>{error}</li>
    {/each}
  </ul>
{/if}

<style>
  .list {
    margin: 0;
    padding-left: 1.5rem;
  }
</style>
