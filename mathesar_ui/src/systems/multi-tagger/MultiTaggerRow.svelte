<script lang="ts">
  import type { Readable } from 'svelte/store';

  import {
    DummyCheckbox,
    MatchHighlighter,
    Spinner,
    Truncate,
  } from '@mathesar-component-library';

  import type { MultiTaggerOption } from './MultiTaggerOption';

  export let option: Readable<MultiTaggerOption>;
  export let searchValue: string;
  export let selected: boolean;
  export let onToggle: () => void;
  export let onHover: (() => void) | undefined = undefined;

  $: ({ summary, loading, mappingId } = $option);
  $: checked = mappingId !== undefined;
</script>

<button
  class="record passthrough"
  class:selected
  on:click={onToggle}
  tabindex="-1"
  disabled={loading}
  on:mousemove={onHover}
>
  {#if loading}
    <Spinner />
  {:else}
    <DummyCheckbox {checked} />
  {/if}
  <Truncate>
    <MatchHighlighter text={summary} substring={searchValue} />
  </Truncate>
</button>

<style>
  .record {
    padding: var(--sm4) var(--sm3);
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--sm4);
    align-items: center;
    cursor: pointer;
    width: 100%;
  }
  .record.selected {
    background: var(--color-navigation-20);
  }
</style>
