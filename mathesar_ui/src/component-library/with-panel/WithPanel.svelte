<script lang="ts">
  import { slider } from '@mathesar-component-library';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'right';
  export let sizePx = 300;
  export let minSizePx = 50;
  export let showPanel = true;

  let isResizing = false;

  $: sizingDimension = (() => {
    switch (placement) {
      case 'top':
      case 'bottom':
        return 'height' as const;
      case 'left':
      case 'right':
        return 'width' as const;
      default:
        return assertExhaustive(placement);
    }
  })();
  $: style = `${sizingDimension}: ${sizePx}px;`;
</script>

<div
  class="with-panel"
  class:is-resizing={isResizing}
  class:top={placement === 'top'}
  class:bottom={placement === 'bottom'}
  class:left={placement === 'left'}
  class:right={placement === 'right'}
>
  <div class="main">
    <slot />
  </div>
  {#if showPanel}
    <div class="panel" {style}>
      <div
        class="resizer"
        use:slider={{
          getStartingValue: () => sizePx,
          onMove: (value) => {
            sizePx = value;
          },
          onStart: () => {
            isResizing = true;
          },
          onStop: () => {
            isResizing = false;
          },
          min: minSizePx,
          axis: sizingDimension === 'width' ? 'x' : 'y',
          invert: placement === 'right' || placement === 'bottom',
        }}
      />
      <slot name="panel" />
    </div>
  {/if}
</div>
