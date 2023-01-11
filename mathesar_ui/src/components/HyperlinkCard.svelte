<script lang="ts">
  import { DropdownMenu } from '@mathesar-component-library';
  import { iconMoreActions } from '@mathesar/icons';

  export let href: string;
  export let ariaLabel: string | undefined = undefined;

  let isHoveringMenuTrigger = false;
</script>

<div class="hyperlink-card" class:hovering-menu-trigger={isHoveringMenuTrigger}>
  <a class="link passthrough" {href} aria-label={ariaLabel}>
    <div class="top">
      <div class="top-content"><slot name="top" /></div>
      <div class="fake-button" />
    </div>
    <div class="bottom">
      <slot name="bottom" />
    </div>
  </a>
  <div
    class="menu-container"
    on:mouseenter={() => {
      isHoveringMenuTrigger = true;
    }}
    on:mouseleave={() => {
      isHoveringMenuTrigger = false;
    }}
  >
    <DropdownMenu
      showArrow={false}
      triggerAppearance="plain"
      triggerClass="dropdown-menu-button"
      closeOnInnerClick={true}
      trigger
      label=""
      icon={iconMoreActions}
      size="small"
    >
      <slot name="menu" />
    </DropdownMenu>
  </div>
</div>

<style>
  .hyperlink-card {
    position: relative;
    isolation: isolate;
    --menu-trigger-size: 3rem;
    --padding: 1rem;
  }
  .link {
    display: block;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-l);
    cursor: pointer;
    overflow: hidden;
    height: 100%;
  }
  .link:hover {
    border-color: var(--slate-500);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }
  .top {
    display: flex;
    overflow: hidden;
  }
  .top-content {
    flex: 1 1 auto;
    overflow: hidden;
    font-size: var(--text-size-large);
    height: var(--menu-trigger-size);
    display: flex;
    align-items: center;
    padding: 0 var(--padding);
  }
  .fake-button {
    flex: 0 0 auto;
    width: var(--menu-trigger-size);
    height: var(--menu-trigger-size);
  }
  .hovering-menu-trigger .fake-button {
    background: var(--slate-100);
  }
  .bottom:not(:empty) {
    padding: 0 var(--padding) var(--padding) var(--padding);
  }
  .menu-container {
    position: absolute;
    top: 0;
    right: 0;
    width: var(--menu-trigger-size);
    height: var(--menu-trigger-size);
    z-index: 1;
  }
  .menu-container :global(.dropdown-menu-button) {
    width: 100%;
    height: 100%;
    font-size: var(--text-size-large);
    color: var(--slate-500);
  }
  .menu-container :global(.dropdown-menu-button:hover) {
    color: var(--slate-800);
    background: none;
  }
</style>
