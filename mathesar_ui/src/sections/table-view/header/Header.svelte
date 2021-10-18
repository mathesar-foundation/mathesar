<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';

  import type {
    TabularDataStore,
    TabularData,
    TableColumn,
    ColumnPosition,
    ColumnPositionMap,
    Columns,
    Display,
    Meta,
    Records,
  } from '@mathesar/stores/table-data/types';
  import HeaderCell from './HeaderCell.svelte';
  import NewColumnCell from './NewColumnCell.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  let columns: Columns;
  let display: Display;
  let meta: Meta;
  let records: Records;
  $: ({
    columns, records, meta, display,
  } = $tabularData as TabularData);
  $: ({ horizontalScrollOffset, columnPositionMap } = display);

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

  async function columnDelete(event) {
    const columnId: number | null = (event.detail ?? null) as number;
    await columns.deleteColumn(columnId);
    void columns.fetch();
    void records.fetch();
  }

  function addColumn(e: CustomEvent<Partial<TableColumn>>) {
    void columns.add(e.detail);
  }
</script>

<div bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;">
  </div>

  {#each $columns.data as column (column.name)}
    <HeaderCell {column} {meta}
      columnPosition={getColumnPosition($columnPositionMap, column.name)} on:columnDelete={columnDelete}/>
  {/each}

  <NewColumnCell {display} columnData={$columns.data} on:addColumn={addColumn}/>
</div>
