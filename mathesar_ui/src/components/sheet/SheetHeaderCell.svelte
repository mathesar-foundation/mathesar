<script lang="ts">
  import { getSheetContext } from './utils';
  import SheetHeaderResizer from './SheetHeaderResizer.svelte';

  type SheetColumnIdentifierKey = $$Generic;

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let columnIdentifierKey: SheetColumnIdentifierKey;

  $: style = $columnStyleMap.get(columnIdentifierKey);

  export let isStatic = false;
  export let isControlCell = false;
  export let isResizable = true;
</script>

<div
  class="cell header-cell"
  class:static={isStatic}
  class:resizable={isResizable}
  class:row-control={isControlCell}
  {style}
>
  <slot />

  {#if isResizable}
    <SheetHeaderResizer {columnIdentifierKey} />
  {/if}
</div>
