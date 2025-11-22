<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  export let component: typeof SvelteComponent;
</script>

<svelte:component this={component} {...$$restProps}>
  <h1 data-testid="slot">Slot test content</h1>
</svelte:component>
