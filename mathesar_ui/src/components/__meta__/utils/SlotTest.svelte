<script>
  export let component;
</script>

<svelte:component this={component} {...$$restProps}>
  <h1 data-testid="slot">Slot test content</h1>
</svelte:component>
