<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/Icon.d';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import { createEventDispatcher } from 'svelte';
  import {
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library-dir/label/LabelController';

  const dispatch = createEventDispatcher();

  export let icon: IconProps | undefined = undefined;
  export let disabled = false;

  let labelController: LabelController | undefined;
  if ($$slots.control) {
    labelController = new LabelController();
    setLabelControllerInContext(labelController);
  }

  function handleClick() {
    if (disabled) {
      return;
    }
    dispatch('click');
  }
</script>

<div class="menu-item" on:click={handleClick} class:disabled>
  <div class="control cell"><slot name="control" /></div>
  <div class="icon cell">
    {#if icon}
      <Icon {...icon} />
    {/if}
  </div>
  <div class="label cell">
    {#if labelController}
      <Label controller={labelController}><slot /></Label>
    {:else}
      <slot />
    {/if}
  </div>
</div>

<style>
  .menu-item {
    display: contents;
  }
  .menu-item:not(.disabled) {
    cursor: pointer;
  }
  .menu-item:not(.disabled):hover > * {
    background-color: #f0f0f0;
  }
  .disabled {
    color: #999;
  }
  .control {
    grid-column: 1;
  }
  .icon {
    grid-column: 2;
  }
  .label {
    grid-column: 3;
  }
  .cell:not(:empty) {
    padding: 0.1em 0.4em;
  }
</style>
