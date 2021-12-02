<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';

  import type {
    TabularDataStore,
    TabularData,
    Column,
    ColumnPosition,
    ColumnPositionMap,
    ColumnsDataStore,
    Display,
    Meta,
  } from '@mathesar/stores/table-data/types';
  import type { ConstraintsDataStore } from '@mathesar/stores/table-data/types';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';
  import DeleteColumnModal from './DeleteColumnModal.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  let columnsDataStore: ColumnsDataStore;
  let constraintsDataStore: ConstraintsDataStore;
  let display: Display;
  let meta: Meta;
  let isDeleteModalOpen = false;
  let column: Column;

  $: ({
    columnsDataStore, meta, display, constraintsDataStore,
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
    _name: Column['name'],
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

  function addColumn(e: CustomEvent<Partial<Column>>) {
    void columnsDataStore.add(e.detail);
  }

  function openColumnModal(_column: Column) {
    column = _column;
    isDeleteModalOpen = true;
  }
</script>

<div bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;">
  </div>

  {#each $columnsDataStore.columns as column (column.name)}
    <HeaderCell
      {column}
      {meta}
      {columnsDataStore}
      {constraintsDataStore}
      columnPosition={getColumnPosition($columnPositionMap, column.name)}
      on:columnDelete={() => openColumnModal(column)}
    />
  {/each}

  <NewColumnCell {display} columns={$columnsDataStore.columns} on:addColumn={addColumn}/>

  {#if isDeleteModalOpen}
    <DeleteColumnModal bind:isOpen={isDeleteModalOpen} {columnsDataStore} {column}/>
  {/if}
</div>
