<script lang="ts">
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import {
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library-dir/label/LabelController';

  import MenuItemContents from './MenuItemContents.svelte';
  import MenuItemWrapper from './MenuItemWrapper.svelte';

  export let icon: IconProps | undefined = undefined;
  export let checked: boolean | null = false;
  export let disabled = false;
  export let hasNotificationDot = false;

  const labelController = new LabelController();
  setLabelControllerInContext(labelController);
  $: if (disabled) {
    labelController.disabled.set(disabled);
  }

  function handleClick(e: MouseEvent) {
    if (disabled) {
      return;
    }
    if ((e.target as HTMLElement).hasAttribute('data-menu-control')) {
      return;
    }
    checked = !checked;
  }
</script>

<MenuItemWrapper
  on:click={handleClick}
  {disabled}
  {labelController}
  {...$$restProps}
>
  <MenuItemContents {icon} {hasNotificationDot}>
    <Checkbox slot="control" bind:checked {disabled} data-menu-control />
    <Label data-menu-control controller={labelController}>
      <slot />
    </Label>
  </MenuItemContents>
</MenuItemWrapper>
