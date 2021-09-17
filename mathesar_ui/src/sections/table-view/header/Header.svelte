<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    TableColumnData,
    ColumnPosition,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_MARGIN_LEFT,
    DEFAULT_ROW_RIGHT_PADDING,
  } from '@mathesar/stores/tableData';
  import { currentDBMathesarTypes } from '@mathesar/stores/mathesarTypes';
  import HeaderCell from './HeaderCell.svelte';

  export let tableId: number;
  export let columns: TableColumnData;
  export let sort: SortOption = new Map();
  export let group: GroupOption = new Set();
  export let columnPosition: ColumnPosition = new Map();
  export let horizontalScrollOffset = 0;
  export let isResultGrouped: boolean;

  let headerRef: HTMLElement;

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange(horizontalScrollOffset);

  let paddingLeft: number;
  $: paddingLeft = isResultGrouped ? GROUP_MARGIN_LEFT : 0;

  function onHeaderScroll(scrollLeft: number) {
    if (horizontalScrollOffset !== scrollLeft) {
      horizontalScrollOffset = scrollLeft;
    }
  }

  onMount(() => {
    onHScrollOffsetChange(horizontalScrollOffset);

    const scrollListener = (event: Event) => {
      const { scrollLeft } = event.target as HTMLElement;
      onHeaderScroll(scrollLeft);
    };

    headerRef.addEventListener('scroll', scrollListener);

    return () => {
      headerRef.removeEventListener('scroll', scrollListener);
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: mathesarTypes = $currentDBMathesarTypes;
</script>

<div bind:this={headerRef} class="header">
  <div
    class="cell row-control"
    style="width:{DEFAULT_COUNT_COL_WIDTH + paddingLeft}px;"
  />

  {#each columns.data as column (column.name)}
    <HeaderCell
      tableId={tableId}
      mathesarTypes={mathesarTypes}
      bind:sort
      bind:group
      column={column}
      columnPosition={columnPosition}
      paddingLeft={paddingLeft}
      on:reload
    />
  {/each}
  <div
    class="cell"
    style="width:{70 + DEFAULT_ROW_RIGHT_PADDING}px;left:{columnPosition.get(
      '__row',
    ).width + paddingLeft}px;"
  >
    <div class="add">+</div>
  </div>
</div>

<style global lang="scss">
  @import "Header.scss";
</style>
