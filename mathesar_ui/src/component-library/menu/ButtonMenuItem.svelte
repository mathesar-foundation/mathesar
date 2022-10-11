<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let icon: IconProps | undefined = undefined;
  export let disabled = false;
  export let danger = false;

  function handleClick() {
    if (disabled) {
      return;
    }
    dispatch('click');
  }
</script>

<div class="menu-item" on:click={handleClick} class:disabled class:danger>
  <div class="spacer cell" />
  <div class="control cell" />
  <div class="icon cell">
    {#if icon}<Icon {...icon} />{/if}
  </div>
  <!--
    Why not put the button higher up, enclosing everything?

    Because we need for `.menu-item` to be `display: contents` to make the grid
    cells line up. We lose the semantic value of a button if we set `display:
    contents` on it. Putting it here retains a11y by keeping the label text
    within the button, and also because the click handler is set higher up the
    user can still click anywhere. I'm not sure this is perfectly sound. Open
    to better solutions.
  -->
  <button class="label cell passthrough-button"><slot /></button>
  <div class="spacer cell" />
</div>
