<script lang="ts">
  export let tag = 'div';
  export let disabled = false;
  export let danger = false;
</script>

<svelte:element
  this={tag}
  {...$$restProps}
  class="menu-item"
  role="menuitem"
  on:click
  class:disabled
  class:danger
>
  <slot />
</svelte:element>
