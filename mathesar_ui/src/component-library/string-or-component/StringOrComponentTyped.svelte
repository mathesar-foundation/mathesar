<!--
  @component

  This component replaces `StringOrComponent` (which is deprecated)
-->
<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import type { ComponentWithProps } from '@mathesar-component-library-dir/types';
  import Render from '../render/Render.svelte';

  type T = $$Generic<SvelteComponent>;

  export let arg: string | string[] | ComponentWithProps<T>;
</script>

{#if typeof arg === 'string'}
  {arg}
{:else if Array.isArray(arg)}
  {#each arg as paragraph}
    <p>{paragraph}</p>
  {/each}
{:else}
  <Render componentWithProps={arg} />
{/if}
