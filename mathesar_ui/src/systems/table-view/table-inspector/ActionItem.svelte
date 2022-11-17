<script lang="ts">
  import { iconExternalLink } from '@mathesar/component-library';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import type { IconProps } from '@mathesar/component-library/types';

  export let danger = false;
  export let suffixIcon: IconProps | undefined = undefined;
  export let href: string | undefined = undefined;

  $: suffixIcon = (function () {
    if (suffixIcon) {
      return suffixIcon;
    }
    if (href) {
      return iconExternalLink;
    }
    return undefined;
  })();
  $: element = href === undefined ? 'button' : 'a';
</script>

<svelte:element
  this={element}
  {href}
  on:click
  class:danger
  class="action-item-root"
>
  <div>
    <slot />
  </div>
  {#if suffixIcon}
    <Icon {...suffixIcon} />
  {/if}
</svelte:element>

<style lang="scss">
  .action-item-root {
    padding: 0.75rem 1rem;
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: var(--white);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    color: inherit;

    &:hover {
      border-color: var(--brand-500);
    }

    > :global(* + *) {
      margin-left: 0.5rem;
    }

    > div {
      display: flex;
      align-items: center;

      > :global(* + *) {
        margin-left: 0.25rem;
      }
    }
  }

  .action-item-root.danger {
    border-color: var(--red-500);
    color: var(--red-500);
  }
</style>
