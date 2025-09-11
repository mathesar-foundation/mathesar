<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let href: string | undefined = undefined;
  export let index: number;
  export let selectionIndex: number | undefined = undefined;
  export let setSelectionIndex: (i: number) => void;

  $: isSelected = selectionIndex === index;

  function handleClick(event: MouseEvent) {
    // Prevent default so that we handle navigation imperatively via functions
    // in the parent component which also perform other side effects such as
    // closing the modal after navigation.
    event.preventDefault();
    dispatch('click');
  }

  function handleMouseMove() {
    if (selectionIndex === undefined) {
      return;
    }
    setSelectionIndex(index);
  }
</script>

{#if href}
  <a
    class="passthrough tr"
    {href}
    on:click={handleClick}
    class:selected={isSelected}
    on:mousemove={handleMouseMove}
    tabindex="-1"
  >
    <slot />
  </a>
{:else}
  <div
    class="passthrough tr"
    on:click={handleClick}
    class:selected={isSelected}
    on:mousemove={handleMouseMove}
    tabindex="-1"
  >
    <slot />
  </div>
{/if}

<style>
  .tr {
    cursor: pointer;
    display: table-row;
  }
  .tr.selected {
    background: var(--cell-bg-color-row-selected);
  }
</style>
