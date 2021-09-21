<script lang="ts">
  import { getContext } from 'svelte';
  import { get } from 'svelte/store';
  import type {
    TabularDataStore,
    TabularData,
    Display,
    Records,
  } from '@mathesar/stores/table-data/types';

  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  let savedRecords: Records['savedRecords'];
  let newRecords: Records['newRecords'];
  $: ({ id, records, display } = $tabularData as TabularData);
  $: ({
    rowWidth, horizontalScrollOffset,
  } = display as Display);
  $: ({ savedRecords, newRecords } = records as Records);

  let bodyRef: HTMLDivElement;

  function getItemSize() {
    const defaultRowHeight = 30;
    // TODO: Check and set extra height for group. Needs UX rethought.
    return defaultRowHeight;
  }

  function getItemKey(index: number): number | string {
    // TODO: Check and return primary key
    const newRecordsData = get(newRecords);
    if (newRecordsData?.[index]) {
      return newRecordsData[index].__identifier;
    }
    const savedRecordData = get(savedRecords);
    if (savedRecordData?.[index - newRecordsData.length]) {
      return savedRecordData[index - newRecordsData.length].__identifier;
    }
    return `__index_${index}`;
  }

  function checkAndResetActiveCell(event: Event) {
    if (!bodyRef.contains(event.target as HTMLElement)) {
      (display as Display).resetActiveCell();
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
        bind:horizontalScrollOffset={$horizontalScrollOffset}
        {height}
        width={$rowWidth || null}
        itemCount={$savedRecords.length + $newRecords.length}
        paddingBottom={20}
        itemSize={getItemSize}
        itemKey={getItemKey}
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it}
            {#if $newRecords[it.index]}
              <Row style={it.style} bind:row={$newRecords[it.index]}/>
            {:else if $savedRecords[it.index - $newRecords.length]}
              <Row style={it.style} bind:row={$savedRecords[it.index - $newRecords.length]}/>
            {/if}
          {/if}
        {/each}
      </VirtualList>
    {/key}
  </Resizer>
</div>
