<script lang="ts">
  // Additional classes
  let classes = '';
  export { classes as class };
</script>

<div
  class={['input-group', classes].join(' ')}
  {...$$restProps}
>
  <slot></slot>
</div>

<style global lang="scss">
  @import "InputGroup.scss";
</style>
