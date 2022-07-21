<script lang="ts">
  export let errors: string[] = [];
</script>

<div class="form-field">
  <slot />
  {#if errors.length}
    <div class="errors">
      {#if errors.length === 1}
        {errors[0]}
      {:else}
        <ul>
          {#each errors as error}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .errors {
    margin: 0.5em 0 0 0em;
    color: var(--danger-color);
  }

  ul {
    margin: 0;
    padding: 0;
  }
</style>
