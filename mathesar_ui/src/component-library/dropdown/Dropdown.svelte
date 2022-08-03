<script lang="ts">
  import type { Placement } from '@popperjs/core/lib/enums';
  import type {
    Appearance,
    Size,
  } from '@mathesar-component-library-dir/commonTypes';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  import AttachableDropdown from './AttachableDropdown.svelte';
  import { iconDown } from '../common/icons';

  export let triggerClass = '';
  export let triggerAppearance: Appearance = 'default';
  export let contentClass = '';
  export let isOpen = false;
  export let closeOnInnerClick = false;
  export let ariaLabel: string | undefined = undefined;
  export let ariaControls: string | undefined = undefined;
  export let placement: Placement = 'bottom-start';
  export let showArrow = true;
  export let size: Size = 'medium';

  let triggerElement: HTMLElement | undefined;

  function calculateTriggerClass(
    _triggerClass: string,
    _showArrow: boolean,
  ): string {
    const classes = ['dropdown', 'trigger'];
    if (_triggerClass) {
      classes.push(_triggerClass);
    }
    if (!_showArrow) {
      classes.push('no-arrow');
    }
    return classes.join(' ');
  }

  $: tgClasses = calculateTriggerClass(triggerClass, showArrow);

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
  }
</script>

<Button
  bind:element={triggerElement}
  appearance={triggerAppearance}
  class={tgClasses}
  on:click={toggle}
  aria-controls={ariaControls}
  aria-haspopup="listbox"
  aria-label={ariaLabel}
  {size}
  on:keydown
  on:focus
  on:blur
  {...$$restProps}
>
  <span class="label">
    <slot name="trigger" />
  </span>
  {#if showArrow}
    <span class="arrow">
      <Icon {...iconDown} />
    </span>
  {/if}
</Button>

<AttachableDropdown
  trigger={triggerElement}
  {isOpen}
  {placement}
  class={contentClass}
  {closeOnInnerClick}
  on:close={close}
  on:open
  on:close
>
  <slot name="content" />
</AttachableDropdown>
