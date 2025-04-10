<script lang="ts">
  export let tag = 'div';
  export let disabled = false;
  export let danger = false;

  let classes = '';
  export { classes as class };
</script>

<svelte:element
  this={tag}
  {...$$restProps}
  class="menu-item {classes}"
  role="menuitem"
  class:disabled
  class:danger
>
  <slot />
</svelte:element>
