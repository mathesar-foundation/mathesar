<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import { createEventDispatcher } from 'svelte';
  import MenuItemWrapper from './MenuItemWrapper.svelte';
  import MenuItemContents from './MenuItemContents.svelte';

  const dispatch = createEventDispatcher();

  export let label: string | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let disabled = false;
  /** Visually indicates that the action is destructive */
  export let danger = false;
  export let hasNotificationDot = false;

  function handleClick() {
    if (disabled) {
      return;
    }
    dispatch('click');
  }
</script>

<MenuItemWrapper on:click={handleClick} {disabled} {danger} {...$$restProps}>
  <MenuItemContents {icon} {hasNotificationDot}>
    <!--
      Why not put the button higher up, enclosing everything?

      Because we need for `.menu-item` to be `display: contents` to make the grid
      cells line up. We lose the semantic value of a button if we set `display:
      contents` on it. Putting it here retains a11y by keeping the label text
      within the button, and also because the click handler is set higher up the
      user can still click anywhere. I'm not sure this is perfectly sound. Open
      to better solutions.
    -->
    <button class="passthrough-button">
      {#if label}
        {label}
      {:else}
        <slot />
      {/if}
    </button>
  </MenuItemContents>
</MenuItemWrapper>
