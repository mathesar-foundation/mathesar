<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { iconExpandDown } from '@mathesar-component-library-dir/common/icons';
  import type { Appearance } from '@mathesar-component-library-dir/commonTypes';

  export let isOpen = false;
  export let triggerAppearance: Appearance = 'default';
  function toggle() {
    isOpen = !isOpen;
  }
</script>

<div class="collapsible">
  <div class="collapsible-header">
    <slot name="trigger" {toggle} {isOpen}>
      <Button
        appearance={triggerAppearance}
        class="collapsible-header-btn"
        on:click={toggle}
      >
        <Icon
          {...iconExpandDown}
          size="0.9rem"
          rotate={isOpen ? undefined : 270}
          class="collapsible-header-icon"
        />
        <div class="collapsible-header-title">
          <slot name="header" />
        </div>
      </Button>
    </slot>
    <slot name="trigger-aside" />
  </div>

  {#if isOpen}
    <div class="collapsible-content">
      <slot name="content" />
    </div>
  {/if}
</div>
