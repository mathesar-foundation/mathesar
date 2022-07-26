<script lang="ts">
  import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';

  export let isOpen = false;
</script>

<div class="collapsible">
  <Button
    class="collapsible-header"
    on:click={() => {
      isOpen = !isOpen;
    }}
  >
    <div class="collapsible-header-title">
      <slot name="header" />
    </div>
    <Icon
      data={faChevronDown}
      size="0.7rem"
      rotate={isOpen ? 180 : undefined}
    />
  </Button>
  {#if isOpen}
    <div class="collapsible-content">
      <slot name="content" />
    </div>
  {/if}
</div>
