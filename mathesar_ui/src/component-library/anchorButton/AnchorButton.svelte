<!-- TODO: Add support for disabled state -->
<script lang="ts">
  export let href: string;

  let classes = '';
  export { classes as class };
</script>

<a {...$$restProps} {href} class={[classes, 'anchor-button'].join(' ')}>
  <slot />
</a>
