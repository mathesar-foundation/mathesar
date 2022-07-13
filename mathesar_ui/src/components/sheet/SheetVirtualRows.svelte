<script lang="ts">
  import { getSheetContext } from './utils';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';
  import type { Props as VirtualListProps } from './virtual-list/listUtils';

  const { stores } = getSheetContext();
  const { rowWidth } = stores;

  export let scrollOffset: VirtualListProps['scrollOffset'] = 0;
  export let itemCount: VirtualListProps['itemCount'];
  export let itemSize: VirtualListProps['itemSize'];
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  export let itemKey: VirtualListProps['itemKey'];
</script>

<div data-sheet-element="body" tabindex="-1">
  <Resizer let:height>
    <VirtualList
      bind:horizontalScrollOffset
      bind:scrollOffset
      {height}
      width={$rowWidth}
      {itemCount}
      {paddingBottom}
      {itemSize}
      {itemKey}
      let:items
      let:api
    >
      <slot {items} {api} />
    </VirtualList>
  </Resizer>
</div>

<style lang="scss">
  [data-sheet-element='body'] {
    position: relative;
    flex-shrink: 0;
    flex-grow: 1;
    overflow: hidden;
  }
</style>
