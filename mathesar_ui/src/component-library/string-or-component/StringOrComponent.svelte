<script lang="ts">
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

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
