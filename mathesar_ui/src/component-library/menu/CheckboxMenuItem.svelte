<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import {
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library-dir/label/LabelController';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import Label from '@mathesar-component-library-dir/label/Label.svelte';

  export let icon: IconProps | undefined = undefined;
  export let checked: boolean | null = false;
  export let disabled = false;

  const labelController = new LabelController();
  setLabelControllerInContext(labelController);
  $: if (disabled) {
    labelController.disabled.set(disabled);
  }

  function handleClick() {
    if (disabled) {
      return;
    }
    checked = !checked;
  }
</script>

<div class="menu-item" on:click={handleClick} class:disabled>
  <Label controller={labelController} on:click --display="contents">
    <span class="spacer cell" />
    <span class="control cell">
      <Checkbox bind:checked {labelController} {disabled} />
    </span>
    <span class="icon cell">
      {#if icon}<Icon {...icon} />{/if}
    </span>
    <span class="label cell"><slot /></span>
    <span class="spacer cell" />
  </Label>
</div>
