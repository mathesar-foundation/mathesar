<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
    DEFAULT_ROW_RIGHT_PADDING,
  } from '@mathesar/stores/table-data';

  import type {
    TabularDataStore,
    TabularData,
    TableColumn,
    ColumnPosition,
    ColumnPositionMap,
  } from '@mathesar/stores/table-data/types';
  import HeaderCell from './HeaderCell.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({
    columns, meta, display,
  } = $tabularData as TabularData);
  $: ({ horizontalScrollOffset, rowWidth, columnPositionMap } = display as TabularData['display']);

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

  function getColumnPosition(
    _columnPositionMap: ColumnPositionMap,
    _name: TableColumn['name'],
  ): ColumnPosition {
    return _columnPositionMap.get(_name);
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
  <div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;">
  </div>

  {#each $columns.data as column (column.name)}
    <HeaderCell {column} {meta}
      columnPosition={getColumnPosition($columnPositionMap, column.name)}/>
  {/each}

  <div class="cell" style="width:{DEFAULT_ROW_RIGHT_PADDING}px;left:{$rowWidth}px">
  </div>
</div>
