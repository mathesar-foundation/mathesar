<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import MarginTrim from '@mathesar-component-library-dir/margin-trim/MarginTrim.svelte';
  import type { ComponentWithProps } from '@mathesar-component-library-dir/types';

  import RenderComponentWithProps from './RenderComponentWithProps.svelte';

  type T = $$Generic<SvelteComponent>;

  export let arg: string | string[] | ComponentWithProps<T> | undefined =
    undefined;
</script>

{#if arg === undefined}
  {''}
{:else if typeof arg === 'string'}
  {arg}
{:else if Array.isArray(arg)}
  {#if arg.length === 0}
    {''}
  {:else if arg.length === 1}
    {arg[0]}
  {:else}
    <MarginTrim>
      {#each arg as paragraph}
        <p>{paragraph}</p>
      {/each}
    </MarginTrim>
  {/if}
{:else}
  <RenderComponentWithProps componentWithProps={arg} />
{/if}
