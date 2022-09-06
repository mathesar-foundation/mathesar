<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let href: string | undefined = undefined;
</script>

{#if href}
  <a
    class="passthrough"
    {href}
    title="Navigate to Record"
    on:click={() => dispatch('linkClick')}
  >
    <slot />
  </a>
{:else}
  <div
    role="button"
    aria-label="Create New Record and Select it"
    title="Create New Record and Select it"
    on:click={() => dispatch('buttonClick')}
  >
    <slot />
  </div>
{/if}
