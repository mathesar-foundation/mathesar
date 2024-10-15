<script lang="ts">
  import { iconMoreActions } from '@mathesar/icons';
  import {
    DropdownMenu,
    makeStyleStringFromCssVariables,
  } from '@mathesar-component-library';

  export let href: string;
  export let ariaLabel: string | undefined = undefined;
  export let cssVariables: Record<string, string> | undefined = undefined;

  let isHoveringMenuTrigger = false;
  let isCardFocused = false;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
</script>

<div
  class="card"
  class:focus={isCardFocused}
  class:hovering-menu-trigger={isHoveringMenuTrigger}
  {style}
>
  <a
    class="link passthrough"
    {href}
    aria-label={ariaLabel}
    on:focusin={() => {
      isCardFocused = true;
    }}
    on:focusout={() => {
      isCardFocused = false;
    }}
  >
    <div class="top">
      <slot />
    </div>
    {#if $$slots.description}
      <div class="description">
        <slot name="description" />
      </div>
    {/if}
  </a>
  {#if $$slots.menu}
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
        triggerAppearance="ghost"
        triggerClass="dropdown-menu-button"
        closeOnInnerClick={true}
        placements={['bottom-end', 'right-start', 'left-start']}
        label=""
        icon={iconMoreActions}
        size="small"
      >
        <slot name="menu" />
      </DropdownMenu>
    </div>
  {/if}
  {#if $$slots.footer}
    <div class="footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    position: relative;
    isolation: isolate;
    border-radius: var(--border-radius-l);
    border: 1px solid var(--slate-200);
    background-color: var(--white);
    --padding-v-internal: 1rem;
    --padding-h-internal: 1rem;
  }
  .card.focus {
    outline: 2px solid var(--slate-300);
    outline-offset: 1px;
    border-radius: var(--border-radius-l);
  }
  .link {
    display: grid;
    grid-template: auto 1fr auto / 1fr;
    border-radius: var(--border-radius-l);
    cursor: pointer;
    overflow: hidden;
    height: 100%;
    padding: var(--Card__padding-v, var(--padding-v-internal)) 0;
  }
  .link:hover {
    border-color: var(--slate-500);
    background-color: var(--slate-50);
    box-shadow: 0 0.2rem 0.4rem 0 rgba(0, 0, 0, 0.1);
  }
  .top {
    overflow: hidden;
    font-size: var(--text-size-large);
    height: var(--menu-trigger-size, auto);
    display: flex;
    align-items: center;
    padding: 0 var(--Card__padding-h, var(--padding-h-internal));
  }
  .description:not(:empty) {
    padding: var(--size-x-small)
      var(--Card__padding-h, var(--padding-h-internal)) 0
      var(--Card__padding-h, var(--padding-h-internal));
    font-size: var(--text-size-base);
  }

  .menu-container {
    position: absolute;
    top: 0;
    right: 0;
    margin: var(--size-ultra-small);
    z-index: 1;
  }
  .menu-container :global(.dropdown-menu-button) {
    width: 100%;
    height: 100%;
    font-size: var(--text-size-large);
    color: var(--slate-500);
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .menu-container :global(.dropdown-menu-button:hover) {
    color: var(--slate-800);
    background: var(--slate-100);
  }
  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    z-index: 1;
    cursor: pointer;
  }
</style>
