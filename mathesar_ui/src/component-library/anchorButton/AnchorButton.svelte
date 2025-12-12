<!-- TODO: Add support for disabled state -->
<script lang="ts">
  import type { Appearance, Size } from '../commonTypes';

  export let href: string;

  /**
   * Appearance. One of: 'default', 'primary', 'secondary', 'plain', 'ghost'.
   * @required
   */
  export let appearance: Appearance = 'default';

  /**
   * Size. One of: 'small', 'medium', 'large'.
   * @required
   */
  export let size: Size = 'medium';

  let classes = '';
  export { classes as class };

  $: allClasses = [
    'anchor-button',
    'btn',
    `btn-${appearance}`,
    `size-${size}`,
    classes,
  ].join(' ');
</script>

<a {...$$restProps} {href} class={allClasses}>
  <slot />
</a>
