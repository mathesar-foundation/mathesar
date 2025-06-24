<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import Collapsible from '@mathesar/component-library/collapsible/Collapsible.svelte';

  type $$Props = ComponentProps<Collapsible>;

  export let isOpen = false;
</script>

<div class="collapsible-fieldset" class:open={isOpen}>
  <Collapsible bind:isOpen {...$$restProps}>
    <div slot="header" class="collapsible-fieldset-label">
      <slot name="label" />
    </div>
    <div slot="content" class="collapsible-fieldset-content">
      <slot />
    </div>
  </Collapsible>
</div>

<style>
  .collapsible-fieldset.open :global(.collapsible-header-btn) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .collapsible-fieldset-label {
    font-weight: normal;
  }
  .collapsible-fieldset-content {
    padding: 1rem;
    border-width: 0 1px 1px 1px;
    border-style: solid;
    border-color: var(--border-color);
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
</style>
