<script lang="ts">
  /**
   * Button appearance. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   * @required
   */
  export let appearance : 'default' | 'primary' | 'secondary' | 'plain' | 'ghost' = 'default';

  /**
   * Button size. One of: 'small', 'medium', 'large'.
   * @required
   */
  export let size : 'small' | 'medium' | 'large' = 'medium';

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
        on:click>
  <slot></slot>
</button>

<style global lang="scss">
  @import "Button.scss";
</style>
