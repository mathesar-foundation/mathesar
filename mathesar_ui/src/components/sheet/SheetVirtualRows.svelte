<script lang="ts">
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';
  import type { Props as VirtualListProps } from './virtual-list/listUtils';

  export let scrollOffset: VirtualListProps['scrollOffset'] = 0;
  export let itemCount: VirtualListProps['itemCount'];
  export let itemSize: VirtualListProps['itemSize'];
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  export let itemKey: VirtualListProps['itemKey'];
  export let width: number | undefined = undefined;
</script>

<div class="body" tabindex="-1">
  <Resizer let:height>
    <VirtualList
      bind:horizontalScrollOffset
      bind:scrollOffset
      {height}
      {width}
      {itemCount}
      {paddingBottom}
      {itemSize}
      {itemKey}
      let:items
    >
      {#each items as item (item?.key || item)}
        {#if item}
          <slot style={item.style} itemIndex={item.index} />
        {/if}
      {/each}
    </VirtualList>
  </Resizer>
</div>
