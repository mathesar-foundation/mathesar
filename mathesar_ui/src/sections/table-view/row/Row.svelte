<script lang="ts">
  import { getContext } from 'svelte';
  import {
    DEFAULT_ROW_RIGHT_PADDING,
    getModificationState,
  } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    ColumnPositionMap,
    TabularDataStore,
    TabularData,
    TableRecord,
    Column,
    RecordsData,
    ColumnsDataStore,
  } from '@mathesar/stores/table-data/types';
  import RowControl from './RowControl.svelte';
  import RowCell from './RowCell.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import RowPlaceholder from './RowPlaceholder.svelte';

  export let row: TableRecord;
  export let style: { [key: string]: string | number };

  const tabularData = getContext<TabularDataStore>('tabularData');
  let recordsData: RecordsData;
  let columnsDataStore: ColumnsDataStore;
  $: ({
    recordsData, columnsDataStore, meta, display,
  } = $tabularData as TabularData);
  $: ({ columnPositionMap } = display as TabularData['display']);
  $: ({ selectedRecords, recordModificationState } = meta as TabularData['meta']);
  $: ({ groupInfo } = recordsData);

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPositionMap: ColumnPositionMap,
  ) {
    if (!_style) {
      return '';
    }
    const totalWidth = _columnPositionMap.get('__row')?.width || 0;
    return `position:${_style.position};left:${_style.left}px;`
      + `top:${_style.top}px;height:${_style.height}px;`
      + `width:${totalWidth}px`;
  }

  $: styleString = calculateStyle(
    style,
    $columnPositionMap,
  );

  function getColumnPosition(
    _columnPositionMap: ColumnPositionMap,
    _name: Column['name'],
  ): ColumnPosition {
    return _columnPositionMap.get(_name);
  }

  $: isSelected = ($selectedRecords as Set<unknown>).has(row[$columnsDataStore.primaryKey]);
  $: modificationState = getModificationState(
    $recordModificationState,
    row,
    $columnsDataStore.primaryKey,
  );
  $: rowWidth = getColumnPosition($columnPositionMap, '__row')?.width || 0;

  function checkAndCreateEmptyRow() {
    if (row.__isAddPlaceholder) {
      void recordsData.createOrUpdateRecord(row);
    }
  }
</script>

<div class="row {row.__state} {modificationState || ''}" class:selected={isSelected}
      class:is-group-header={row.__isGroupHeader} class:is-add-placeholder={row.__isAddPlaceholder}
      style={styleString} data-identifier={row.__identifier}
      on:mousedown={checkAndCreateEmptyRow}>
  {#if row.__isNewHelpText}
    <RowPlaceholder {rowWidth}/>
  {:else if row.__isGroupHeader}
    <GroupHeader {row} {rowWidth} groupColumns={$groupInfo.columns} groupCounts={$groupInfo.counts}/>
  {:else}
    <RowControl primaryKeyColumn={$columnsDataStore.primaryKey}
                {row} {meta} recordsData={recordsData}/>

    {#each $columnsDataStore.columns as column (column.name)}
      <RowCell {display} {row} bind:value={row[column.name]} {column} recordsData={recordsData}
        columnPosition={getColumnPosition($columnPositionMap, column.name)}/>
    {/each}
  {/if}
</div>
 
<style global lang="scss">
  @import "Row.scss";
</style>
