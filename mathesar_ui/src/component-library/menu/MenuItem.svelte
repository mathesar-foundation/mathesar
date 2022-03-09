<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/Icon.d';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import {
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library-dir/label/LabelController';
  import MenuItemWrapper from './MenuItemWrapper.svelte';

  const dispatch = createEventDispatcher();

  export let icon: IconProps | undefined = undefined;

  /**
   * Note: if you have a form control within the MenuItem, you'll need to
   * explicitly set it to disabled as well. Its disabled state won't be inferred
   * from the parent MenuItem.
   */
  export let disabled = false;

  let labelController: LabelController | undefined;
  if ($$slots.control) {
    labelController = new LabelController();
    labelController.disabled.set(disabled);
    setLabelControllerInContext(labelController);
  }
  $: if (disabled && labelController) {
    labelController.disabled.set(disabled);
  }

  function handleClick() {
    if (disabled) {
      return;
    }
    dispatch('click');
  }
</script>

<div class="menu-item" on:click={handleClick} class:disabled>
  <MenuItemWrapper {labelController}>
    <div class="spacer cell" />
    <div class="control cell"><slot name="control" /></div>
    <div class="icon cell">
      {#if icon}
        <Icon {...icon} />
      {/if}
    </div>
    {#if labelController}
      <div class="label cell"><slot /></div>
    {:else}
      <button class="label cell passthrough-button"><slot /></button>
    {/if}
    <div class="spacer cell" />
  </MenuItemWrapper>
</div>
