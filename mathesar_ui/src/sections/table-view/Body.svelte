<script lang="ts">
  import { getContext } from 'svelte';
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

  function handleKeyDown(event: KeyboardEvent) {
    if (bodyRef.contains(event.target as HTMLElement)) {
      (display as Display).handleKeyEventsOnActiveCell(event.key);
    } else {
      (display as Display).resetActiveCell();
    }
  }

  function handleTab(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      (display as Display).handleKeyEventsOnActiveCell('ArrowRight');
      event.stopPropagation();
    }
  }

  function handleClick(event: MouseEvent) {
    if (!bodyRef.contains(event.target as HTMLElement)) {
      (display as Display).resetActiveCell();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:mousedown={handleClick}/>

<div bind:this={bodyRef} class="body" tabindex="-1" on:keydown={handleTab}>
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
