<script lang="ts">
  import type { Appearance, Size } from '@mathesar-component-library/types';

  /**
   * Button appearance. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   * @required
   */
  export let appearance : Appearance = 'default';

  /**
   * Button size. One of: 'small', 'medium', 'large'.
   * @required
   */
  export let size : Size = 'medium';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Underlying DOM element for direct access
  export let element: HTMLElement = null;

  $: allClasses = ['btn', `btn-${appearance}`, `size-${size}`, classes].join(' ');
</script>

<button bind:this={element} type="button"
        class={allClasses}
        {...$$restProps}
        on:click
        on:keydown>
  <slot></slot>
</button>

<style global lang="scss">
  @import "Button.scss";
</style>
