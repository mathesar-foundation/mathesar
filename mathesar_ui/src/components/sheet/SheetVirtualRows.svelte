<script lang="ts">
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  import { getSheetContext } from './utils';
  import type { Props as VirtualListProps } from './virtual-list/listUtils';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const { stores, api } = getSheetContext();
  const { rowWidth, horizontalScrollOffset, scrollOffset } = stores;

  export let itemCount: VirtualListProps['itemCount'];
  export let itemSize: VirtualListProps['itemSize'];
  export let paddingBottom = 0;
  export let itemKey: VirtualListProps['itemKey'] | undefined = undefined;
</script>

<div data-sheet-element="body" tabindex="-1">
  <Resizer let:height>
    <VirtualList
      horizontalScrollOffset={$horizontalScrollOffset}
      scrollOffset={$scrollOffset}
      {height}
      width={$rowWidth}
      {itemCount}
      {paddingBottom}
      {itemSize}
      estimatedItemSize={ROW_HEIGHT_PX}
      {itemKey}
      let:items
      let:api={virtualListApi}
      on:scroll={(e) => {
        api.setScrollOffset(e.detail);
      }}
      on:h-scroll={(e) => {
        api.setHorizontalScrollOffset(e.detail);
      }}
    >
      <slot {items} api={virtualListApi} />
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
