<script lang="ts">
  import type { Appearance, Size } from '@mathesar-component-library-dir/commonTypes';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';

  // PROPS
  export let appearance: Appearance = 'default';
  export let variant: string = '';
  export let size: Size = 'medium';
  export let active = false;
  export let type: 'button' | 'submit' = 'button';
  export let element: HTMLElement | undefined = undefined;
  export let tooltip: string | undefined = undefined;

  // DECIDE FINAL APPEARANCE
  $: finalAppearance =
    variant === 'control' || variant === 'input'
      ? variant
      : appearance === 'control' || appearance === 'input'
        ? appearance
        : 'default';

  let classes = '';
  export { classes as class };

  // BUILD CLASS LIST
  $: allClasses = ['btn', `btn-${finalAppearance}`, `size-${size}`, classes].join(' ');
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
