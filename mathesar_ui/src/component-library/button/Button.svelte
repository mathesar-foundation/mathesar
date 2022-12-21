<script lang="ts">
  import type {
    Appearance,
    Size,
  } from '@mathesar-component-library-dir/commonTypes';

  /**
   * Button appearance. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   * @required
   */
  export let appearance: Appearance = 'default';

  /**
   * Button size. One of: 'small', 'medium', 'large'.
   * @required
   */
  export let size: Size = 'medium';

  export let danger = false;
  export let active = false;

  // Additional classes
  let classes = '';
  export { classes as class };

  // Underlying DOM element for direct access
  export let element: HTMLElement | undefined = undefined;

  $: allClasses = ['btn', `btn-${appearance}`, `size-${size}`, classes].join(
    ' ',
  );
</script>

<button
  bind:this={element}
  type="button"
  class={allClasses}
  class:danger
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
