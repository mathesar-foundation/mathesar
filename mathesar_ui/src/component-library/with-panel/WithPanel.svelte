<script lang="ts">
  import slider from '@mathesar-component-library-dir/common/actions/slider';
  import { assertExhaustive } from '@mathesar-component-library-dir/common/utils/typeUtils';

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'right';
  export let sizePx = 300;
  export let minSizePx = 0;
  export let maxSizePx = Infinity;
  export let showPanel = true;
  export let onResizeComplete: (sizePx: number) => void = () => {};

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
  class:horizontal={sizingDimension === 'width'}
  class:vertical={sizingDimension === 'height'}
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
          onStop: (v) => {
            isResizing = false;
            onResizeComplete(v);
          },
          min: minSizePx,
          max: maxSizePx,
          axis: sizingDimension === 'width' ? 'x' : 'y',
          invert: placement === 'right' || placement === 'bottom',
        }}
      />
      <slot name="panel" />
    </div>
  {/if}
</div>
