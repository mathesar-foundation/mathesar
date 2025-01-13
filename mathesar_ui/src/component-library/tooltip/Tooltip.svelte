<script lang="ts">
  import type { Placement } from '@popperjs/core/lib/enums';

  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';

  export let tooltipClass = '';
  /** When true, the tooltip will remain open when hovered */
  export let allowHover = false;
  export let placements: Placement[] = ['top', 'right', 'bottom', 'left'];

  let trigger: HTMLElement | undefined;
  let triggerIsHovered = false;
  let contentIsHovered = false;
  let timeout: number | undefined;

  $: isOpen = triggerIsHovered || (allowHover && contentIsHovered);
</script>

<span
  bind:this={trigger}
  aria-label="Help"
  {...$$restProps}
  on:mouseenter={() => {
    window.clearTimeout(timeout);
    triggerIsHovered = true;
  }}
  on:mouseleave={() => {
    // Keep the dropdown open for a short time after the user leaves the trigger
    // so that they can move their mouse to the dropdown without it closing.
    timeout = window.setTimeout(() => {
      triggerIsHovered = false;
    }, 100);
  }}
>
  <slot name="trigger" />
</span>

<AttachableDropdown
  {trigger}
  {isOpen}
  {placements}
  class="tooltip trim-child-margins {tooltipClass}"
  on:mouseenter={() => {
    contentIsHovered = true;
  }}
  on:mouseleave={() => {
    contentIsHovered = false;
  }}
>
  <slot name="content" />
</AttachableDropdown>
