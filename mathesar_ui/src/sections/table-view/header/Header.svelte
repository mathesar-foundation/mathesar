<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import {
    GROUP_MARGIN_LEFT,
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';

  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/types';
  import HeaderCell from './HeaderCell.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({
    columns, records, meta, display,
  } = $tabularData as TabularData);
  $: ({ horizontalScrollOffset } = display as TabularData['display']);

  $: paddingLeft = $records.groupData ? GROUP_MARGIN_LEFT : 0;

  let headerRef: HTMLElement;

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange($horizontalScrollOffset);

  function onHeaderScroll(scrollLeft: number) {
    if ($horizontalScrollOffset !== scrollLeft) {
      $horizontalScrollOffset = scrollLeft;
    }
  }

  onMount(() => {
    onHScrollOffsetChange($horizontalScrollOffset);

    const scrollListener = (event: Event) => {
      const { scrollLeft } = event.target as HTMLElement;
      onHeaderScroll(scrollLeft);
    };

    headerRef.addEventListener('scroll', scrollListener);

    return () => {
      headerRef.removeEventListener('scroll', scrollListener);
    };
  });
</script>

<div bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH + paddingLeft}px;">
  </div>

  {#each $columns.data as column (column.name)}
    <HeaderCell {column} {meta} {display} {paddingLeft}/>
  {/each}
</div>
