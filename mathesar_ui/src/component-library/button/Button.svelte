<script lang="ts">
  import type { Appearance, Size } from '@mathesar-component-library-dir/commonTypes';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();

  export let appearance: Appearance = 'default';
  export let size: Size = 'medium';
  export let active = false;
  export let type: 'button' | 'submit' = 'button';

  let classes = '';
  export { classes as class };

  export let element: HTMLElement | undefined = undefined;
  export let tooltip: string | undefined = undefined;

  $: allClasses = ['btn', `btn-${appearance}`, `size-${size}`, classes].join(' ');

  function handleClick(event: MouseEvent) {
    dispatch('click', event);
  }
</script>

{#if tooltip || $$slots.tooltip}
  <Tooltip>
    <button
      slot="trigger"
      bind:this={element}
      {type}
      class={allClasses}
      class:active
      on:click={handleClick}
    >
      <slot />
    </button>
    <div slot="content">
      <slot name="tooltip">{tooltip}</slot>
    </div>
  </Tooltip>
{:else}
  <button
    bind:this={element}
    {type}
    class={allClasses}
    class:active
    on:click={handleClick}
  >
    <slot />
  </button>
{/if}

<style>
  .btn {
    cursor: pointer;
    border: none;
    border-radius: 0.25em;
    padding: 0.5em 1em;
    font-size: 1em;
    transition: background-color 0.2s;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .btn.active {
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
  }
</style>
