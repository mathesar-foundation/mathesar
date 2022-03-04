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

<!-- 
Tricky aspects of this CSS:

We want to vertically align all the controls, icons, and labels, even if the
Menu doesn't consistently have a control or icon for all its MenuItems. We're
leveraging the power of CSS grid to horizontally position the controls, icons,
and labels so that they are in vertical alignment across the entire Menu.

This component would be an ideal use-case for sub-grid, but sub-grid is not
widely supported enough yet. So instead we're faking it by setting `display:
contents;` on `.menu-item`. We also want a row hover background, but because of
`display: contents;`, we need to set the hover background, per cell instead of
per row. Because the hover background is per-cell, we can't use `gap` (or there
would be gaps in the background). Foregoing `gap` makes it harder to get
consistent spacing between and around cells, which is why we have the funky
`padding` stuff and extra grid columns. I don't like the extra grid columns.
There may be a cleaner way to do this, but I wasn't able to think of one
quickly.
-->
<style>
  .menu-item {
    display: contents;
  }
  .menu-item:not(.disabled) {
    cursor: pointer;
  }
  .menu-item:not(.disabled):hover .cell {
    background-color: #f0f0f0;
  }
  .disabled {
    color: #999;
  }
  .control {
    grid-column: control;
  }
  .icon {
    grid-column: icon;
  }
  .label {
    grid-column: label;
  }
  .cell:not(:empty) {
    padding: var(--spacing-y) var(--spacing-x);
  }
  .control,
  .icon {
    display: flex;
    align-items: center;
  }
  .cell.control {
    --checkbox-margin-bottom: 0;
  }
  .passthrough-button {
    background: inherit;
    border-radius: inherit;
    border: inherit;
    color: inherit;
    cursor: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
  }
</style>
