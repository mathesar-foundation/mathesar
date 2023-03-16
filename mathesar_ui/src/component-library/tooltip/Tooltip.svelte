<script lang="ts">
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';

  export let tooltipClass = '';

  let trigger: HTMLElement | undefined;
  let isContentShown = false;
</script>

<span
  bind:this={trigger}
  aria-label="Help"
  {...$$restProps}
  on:mouseenter={() => {
    isContentShown = true;
  }}
  on:mouseleave={() => {
    isContentShown = false;
  }}
>
  <slot name="trigger" />
</span>

<AttachableDropdown
  {trigger}
  isOpen={isContentShown}
  placements={['top', 'right', 'bottom', 'left']}
  class="tooltip {tooltipClass}"
>
  <slot name="content" />
</AttachableDropdown>
