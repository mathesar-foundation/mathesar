<script lang="ts">
  import { getContext } from 'svelte';
  import { get } from 'svelte/store';
  import type {
    TabularDataStore,
    TabularData,
    Display,
    Records,
  } from '@mathesar/stores/table-data/types';
  import { States } from '@mathesar/utils/api';

  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  let records: Records;
  let display: Display;
  $: ({ id, records, display } = $tabularData as TabularData);
  $: ({
    rowWidth, horizontalScrollOffset,
  } = display);
  $: ({ savedRecords, newRecords } = records);

  let bodyRef: HTMLDivElement;

  function getItemSize() {
    const defaultRowHeight = 30;
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
        bind:horizontalScrollOffset={$horizontalScrollOffset}
        {height}
        width={$rowWidth || null}
        itemCount={$savedRecords.length + $newRecords.length + 1}
        paddingBottom={20}
        itemSize={getItemSize}
        itemKey={(index) => records.getIterationKey(index)}
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it}
            {#if it.index === 0}
              <Row style={it.style} row={{
                __identifier: '__add_placeholder',
                __isAddPlaceholder: true,
                __state: States.Done,
                }}/>
            {:else if $newRecords[it.index - 1]}
              <Row style={it.style} bind:row={$newRecords[it.index - 1]}/>
            {:else if $savedRecords[it.index - $newRecords.length - 1]}
              <Row style={it.style} bind:row={$savedRecords[it.index - $newRecords.length - 1]}/>
            {/if}
          {/if}
        {/each}
      </VirtualList>
    {/key}
  </Resizer>
</div>
