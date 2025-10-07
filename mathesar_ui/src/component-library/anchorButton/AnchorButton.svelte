<script lang="ts">
  import type { Appearance, Size } from '../commonTypes';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';

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

  export let disabled: boolean = false;

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

<a {...$$restProps} {href}>
  <Button class={allClasses} {disabled}>
    <slot />
  </Button>
</a>
