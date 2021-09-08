<script lang="ts">
  import { getContext } from 'svelte';
  import { DEFAULT_ROW_RIGHT_PADDING, GROUP_MARGIN_LEFT } from '@mathesar/stores/table-data/meta';
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/store';
  import type { ColumnPositionMap } from '@mathesar/stores/table-data/meta';

  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ id, records, meta } = $tabularData as TabularData);
  $: ({
    columnPositionMap, horizontalScrollOffset,
  } = meta as TabularData['meta']);

  // TODO: Compute the following in meta store
  let rowWidth: number;
  let widthWithPadding: number | null;
  $: rowWidth = ($columnPositionMap as ColumnPositionMap)?.get('__row')?.width || 0;
  $: widthWithPadding = rowWidth ? rowWidth + DEFAULT_ROW_RIGHT_PADDING : 0;
  $: totalWidth = widthWithPadding ? widthWithPadding + GROUP_MARGIN_LEFT : null;

  // Be careful while accessing this ref.
  // Resizer may not have created it yet/destroyed it
  let virtualListRef: VirtualList;

  function getItemSize(index: number) {
    const defaultRowHeight = 30;
    // if (data[index]?.__groupInfo) {
    //   return GROUP_ROW_HEIGHT + defaultRowHeight;
    // }
    return defaultRowHeight;
  }

  function getItemKey(index: number): number | string {
    // Check and return primary key
    // Return index by default
    return `__index_${index}`;
  }

  // export function reloadPositions(resetPositions: boolean): void {
  //   if (virtualListRef) {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //     virtualListRef.scrollToPosition(0, 0);
  //     if (resetPositions) {
  //       // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //       virtualListRef.resetAfterIndex(0);
  //     }
  //   }
  // }
</script>

<div class="body">
  <Resizer let:height>
    {#key id}
      <VirtualList
        bind:this={virtualListRef}
        bind:horizontalScrollOffset={$horizontalScrollOffset}
        {height}
        width={totalWidth || null}
        itemCount={$records.data.length}
        paddingBottom={100}
        itemSize={getItemSize}
        itemKey={getItemKey}
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it}
            <Row style={it.style}
                  row={$records.data[it.index] || {}}
                  index={it.index}/>
          {/if}
        {/each}
      </VirtualList>
    {/key}
  </Resizer>
</div>
