<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getTabularDataStoreFromContext,
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/tables/columns';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({
    columnsDataStore,
    meta,
    display,
    constraintsDataStore,
    processedColumns,
  } = $tabularData);
  $: ({ horizontalScrollOffset } = display);

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

  function addColumn(e: CustomEvent<Partial<Column>>) {
    void columnsDataStore.add(e.detail);
  }
</script>

<div bind:this={headerRef} class="header">
  <div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;" />

  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
    <HeaderCell
      {processedColumn}
      {meta}
      {columnsDataStore}
      {constraintsDataStore}
    />
  {/each}

  <NewColumnCell
    {display}
    columns={$columnsDataStore.columns}
    on:addColumn={addColumn}
  />
</div>
