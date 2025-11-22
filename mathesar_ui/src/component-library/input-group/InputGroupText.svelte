<script lang="ts">
  // Additional classes
  let classes = '';
  export { classes as class };
</script>

<span class={['input-group-text', classes].join(' ')} {...$$restProps}>
  <slot />
</span>
