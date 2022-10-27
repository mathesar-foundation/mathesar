<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { iconExpandDown } from '@mathesar-component-library-dir/common/icons';

  export let isOpen = false;
</script>

<div class="collapsible">
  <button
    class="collapsible-header"
    on:click={() => {
      isOpen = !isOpen;
    }}
  >
    <div class="collapsible-header-title">
      <slot name="header" />
    </div>
    <Icon {...iconExpandDown} size="0.7rem" rotate={isOpen ? 180 : undefined} />
  </button>
  {#if isOpen}
    <div class="collapsible-content">
      <slot name="content" />
    </div>
  {/if}
</div>
