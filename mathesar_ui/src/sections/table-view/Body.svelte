<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { get } from 'svelte/store';
  import type {
    TabularDataStore,
    TabularData,
    Display,
    Records,
    TableRecord,
  } from '@mathesar/stores/table-data/types';

  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  let id: TabularData['id'];
  let records: Records;
  let display: Display;
  let virtualListRef: VirtualList;
  let displayableRecords: Display['displayableRecords'];
  $: ({ id, records, display } = $tabularData as TabularData);
  $: ({ newRecords } = records);
  $: ({
    rowWidth, horizontalScrollOffset, displayableRecords,
  } = display);

  async function resetIndex(_newRecords: TableRecord[]) {
    const allRecordLength = get(displayableRecords)?.length;
    if (allRecordLength) {
      const index = allRecordLength - _newRecords.length - 3;
      await tick();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      virtualListRef?.resetAfterIndex(index);
    }
  }

  $: void resetIndex($newRecords);

  let bodyRef: HTMLDivElement;

  function getItemSize(index: number) {
    const defaultRowHeight = 30;
    const allRecords = get(displayableRecords);
    if (allRecords?.[index]?.__isNewHelpText) {
      return 24;
    }

    // TODO: Check and set extra height for group. Needs UX rethought.
    return defaultRowHeight;
  }

  function checkAndResetActiveCell(event: Event) {
    if (!bodyRef.contains(event.target as HTMLElement)) {
      display.resetActiveCell();
    }
  }
</script>

<svelte:window
  on:keydown={checkAndResetActiveCell}
  on:mousedown={checkAndResetActiveCell}/>

<div bind:this={bodyRef} class="body" tabindex="-1">
  <Resizer let:height>
    {#key id}
      <VirtualList
        bind:this={virtualListRef}
        bind:horizontalScrollOffset={$horizontalScrollOffset}
        {height}
        width={$rowWidth}
        itemCount={$displayableRecords.length}
        paddingBottom={20}
        itemSize={getItemSize}
        itemKey={(index) => records.getIterationKey(index)}
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it && $displayableRecords[it.index]}
            <Row style={it.style} bind:row={$displayableRecords[it.index]}/>
          {/if}
        {/each}
      </VirtualList>
    {/key}
  </Resizer>
</div>
