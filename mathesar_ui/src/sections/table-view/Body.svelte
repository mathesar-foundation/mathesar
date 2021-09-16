<script lang="ts">
  import { getContext, tick } from 'svelte';
  import type {
    TabularDataStore,
    TabularData,
    Display,
  } from '@mathesar/stores/table-data/types';

  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ id, records, display } = $tabularData as TabularData);
  $: ({
    rowWidth, horizontalScrollOffset,
  } = display as Display);

  let bodyRef: HTMLDivElement;

  function getItemSize() {
    const defaultRowHeight = 30;
    // TODO: Check and set extra height for group. Needs UX rethought.
    return defaultRowHeight;
  }

  function getItemKey(index: number): number | string {
    // TODO: Check and return primary key
    // Return index by default
    return `__index_${index}`;
  }

  // TODO: Create a common utility action to handle active element based scroll
  function handleScroll() {
    const activeCell: HTMLElement = bodyRef.querySelector('.cell.is-active');
    const activeRow = activeCell?.parentElement;
    const container = bodyRef.querySelector('.virtual-list.outerElement');
    if (container && activeRow) {
      // Vertical scroll
      if (activeRow.offsetTop + activeRow.clientHeight + 40
        > (container.scrollTop + container.clientHeight)) {
        const offsetValue: number = container.getBoundingClientRect().bottom
          - activeRow.getBoundingClientRect().bottom - 40;
        container.scrollTop -= offsetValue;
      } else if (activeRow.offsetTop - 30 < container.scrollTop) {
        container.scrollTop = activeRow.offsetTop - 30;
      }

      // Horizontal scroll
      if (activeCell.offsetLeft + activeRow.clientWidth + 30
        > (container.scrollLeft + container.clientWidth)) {
        const offsetValue: number = container.getBoundingClientRect().right
          - activeCell.getBoundingClientRect().right - 30;
        container.scrollLeft -= offsetValue;
      } else if (activeCell.offsetLeft - 30 < container.scrollLeft) {
        container.scrollLeft = activeCell.offsetLeft - 30;
      }
    }
  }

  function checkAndResetActiveCell(event: Event) {
    if (!bodyRef.contains(event.target as HTMLElement)) {
      (display as Display).resetActiveCell();
    }
  }

  async function handleKeyDownWithinBody(event: KeyboardEvent) {
    (display as Display).handleKeyEventsOnActiveCell(event.key);
    event.stopPropagation();
    await tick();
    handleScroll();
  }
</script>

<svelte:window
  on:keydown={checkAndResetActiveCell}
  on:mousedown={checkAndResetActiveCell}/>

<div bind:this={bodyRef} class="body" tabindex="-1" on:keydown={handleKeyDownWithinBody}>
  <Resizer let:height>
    {#key id}
      <VirtualList
        bind:horizontalScrollOffset={$horizontalScrollOffset}
        {height}
        width={$rowWidth || null}
        itemCount={$records.data.length}
        paddingBottom={20}
        itemSize={getItemSize}
        itemKey={getItemKey}
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it}
            <Row style={it.style}
                  row={$records.data[it.index] || { __state: 'loading' }}/>
          {/if}
        {/each}
      </VirtualList>
    {/key}
  </Resizer>
</div>
