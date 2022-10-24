<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let href: string | undefined = undefined;
  export let index: number;
  export let selectionIndex: number;

  $: element = href ? 'a' : 'div';
  $: isSelected = selectionIndex === index;

  function handleClick() {
    if (!href) {
      dispatch('click');
    }
  }
</script>

<svelte:element
  this={element}
  class="passthrough tr"
  {href}
  on:click={handleClick}
  class:selected={isSelected}
  on:mousemove={() => {
    selectionIndex = index;
  }}
>
  <slot />
</svelte:element>

<style>
  .tr {
    cursor: pointer;
    display: table-row;
  }
  .tr.selected {
    background: var(--color-blue-light);
  }
</style>
