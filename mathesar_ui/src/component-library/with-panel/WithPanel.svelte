<script lang="ts">
  import { assertExhaustive } from '@mathesar/utils/typeUtils';

  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'right';
  export let sizePx = 300;

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
  class:top={placement === 'top'}
  class:bottom={placement === 'bottom'}
  class:left={placement === 'left'}
  class:right={placement === 'right'}
>
  <div class="main">
    <slot />
  </div>

  <div class="panel" {style}>
    <slot name="panel" />
  </div>
</div>
