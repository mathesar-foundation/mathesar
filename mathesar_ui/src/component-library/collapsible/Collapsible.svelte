<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { iconExpandDown } from '@mathesar-component-library-dir/common/icons';

  export let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<div class="collapsible">
  <slot name="trigger" {toggle} {isOpen}>
    <Button class="collapsible-header" on:click={toggle}>
      <div class="collapsible-header-title">
        <slot name="header" />
      </div>
      <Icon
        {...iconExpandDown}
        size="0.7rem"
        rotate={isOpen ? 180 : undefined}
      />
    </Button>
  </slot>
  {#if isOpen}
    <div class="collapsible-content">
      <slot name="content" />
    </div>
  {/if}
</div>
