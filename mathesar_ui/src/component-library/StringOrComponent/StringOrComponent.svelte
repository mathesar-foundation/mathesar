<script context="module" lang="ts">
  export interface ComponentAndProps {
    component: typeof SvelteComponent,
    props?: unknown,
  }
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  export let arg: string | string[] | ComponentAndProps;
</script>

{#if typeof arg === 'string'}
  {arg}
{:else if Array.isArray(arg)}
  {#each arg as paragraph}
  <p>{paragraph}</p>
  {/each}
{:else}
  <svelte:component this={arg.component} {...arg.props} />
{/if}
