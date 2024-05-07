<script lang="ts">
  import type { Placement } from '@popperjs/core/lib/enums';

  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import { iconExpandDown } from '@mathesar-component-library-dir/common/icons';
  import type {
    Appearance,
    Size,
  } from '@mathesar-component-library-dir/commonTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  import AttachableDropdown from './AttachableDropdown.svelte';

  export let triggerClass = '';
  export let triggerAppearance: Appearance = 'default';
  export let contentClass = '';
  export let isOpen = false;
  export let closeOnInnerClick = false;
  export let ariaLabel: string | undefined = undefined;
  export let ariaControls: string | undefined = undefined;
  export let placements: Placement[] | undefined = undefined;
  export let preferredPlacement: Placement | undefined = undefined;
  export let showArrow = true;
  export let size: Size = 'medium';
  export let disabled = false;

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

  function toggle(e: Event) {
    /**
     * If this Dropdown is used in a form we should prevent the default
     * behavior of submitting the form.
     */
    e.preventDefault();
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
  title={ariaLabel}
  {size}
  {disabled}
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
      <Icon {...iconExpandDown} size="0.75em" />
    </span>
  {/if}
</Button>

<AttachableDropdown
  trigger={triggerElement}
  {isOpen}
  {placements}
  {preferredPlacement}
  class={contentClass}
  {closeOnInnerClick}
  on:close={close}
  on:open
  on:close
  let:close={innerClose}
>
  <slot name="content" close={innerClose} />
</AttachableDropdown>
