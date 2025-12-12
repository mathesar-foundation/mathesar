<script lang="ts">
  import type {
    Appearance,
    Size,
  } from '@mathesar-component-library-dir/commonTypes';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';

  export let appearance: Appearance = 'default';
  export let size: Size = 'medium';
  export let active = false;
  export let type: 'button' | 'submit' = 'button';

  let classes = '';
  export { classes as class };

  export let element: HTMLElement | undefined = undefined;
  export let tooltip: string | undefined = undefined;

  $: allClasses = ['btn', `btn-${appearance}`, `size-${size}`, classes].join(
    ' ',
  );
</script>

{#if tooltip || $$slots.tooltip}
  <Tooltip>
    <button
      slot="trigger"
      bind:this={element}
      {type}
      class={allClasses}
      class:active
      {...$$restProps}
      on:click
      on:keydown
      on:focus
      on:blur
      on:mouseenter
      on:mouseleave
      on:mousedown
    >
      <slot />
    </button>
    <div slot="content"><slot name="tooltip">{tooltip}</slot></div>
  </Tooltip>
{:else}
  <button
    bind:this={element}
    {type}
    class={allClasses}
    class:active
    {...$$restProps}
    on:click
    on:keydown
    on:focus
    on:blur
    on:mouseenter
    on:mouseleave
    on:mousedown
  >
    <slot />
  </button>
{/if}
