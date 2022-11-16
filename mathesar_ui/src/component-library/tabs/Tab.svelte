<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Tab } from './TabContainerTypes';

  const dispatch = createEventDispatcher();

  export let componentId: number;
  export let tab: Tab;
  export let totalTabs: number;
  export let isActive = false;
  export let allowRemoval = false;
  export let uniformTabWidth = true;
</script>

<li
  role="presentation"
  class="tab"
  class:active={isActive}
  tabindex="-1"
  style={uniformTabWidth ? `width:${Math.floor(100 / totalTabs)}%;` : undefined}
>
  <div
    role="tab"
    tabindex="0"
    aria-selected={isActive}
    aria-disabled={!!tab.disabled}
    id={isActive ? `mtsr-${componentId}-tab` : undefined}
    data-tinro-ignore
    aria-controls={isActive ? `mtsr-${componentId}-tabpanel` : undefined}
    on:focus
    on:blur
    on:mousedown
    on:click
  >
    <slot />
  </div>

  {#if allowRemoval}
    <button
      type="button"
      aria-label="remove"
      class="remove"
      on:click={(e) => dispatch('remove', e)}
    >
      &times;
    </button>
  {/if}
</li>
