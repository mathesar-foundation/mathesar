<script lang="ts">
  import { getContext } from 'svelte';
  import {
    getModificationState,
    ROW_POSITION_INDEX,
  } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    ColumnPositionMap,
    TabularDataStore,
    Row,
    Column,
  } from '@mathesar/stores/table-data/types';
  import RowControl from './RowControl.svelte';
  import RowCell from './RowCell.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import RowPlaceholder from './RowPlaceholder.svelte';

  export let row: Row;
  export let style: { [key: string]: string | number };

  const tabularData = getContext<TabularDataStore>('tabularData');

  $: ({ recordsData, columnsDataStore, meta, display } = $tabularData);
  $: ({ columnPositionMap } = display);
  $: ({ selectedRecords, recordModificationState } = meta);
  $: ({ grouping } = recordsData);

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPositionMap: ColumnPositionMap,
  ) {
    if (!_style) {
      return '';
    }
    const totalWidth = _columnPositionMap.get(ROW_POSITION_INDEX)?.width || 0;
    return (
      `position:${_style.position};left:${_style.left}px;` +
      `top:${_style.top}px;height:${_style.height}px;` +
      `width:${totalWidth}px`
    );
  }

  $: styleString = calculateStyle(style, $columnPositionMap);

  function getColumnPosition(
    _columnPositionMap: ColumnPositionMap,
    _id: Column['id'],
  ): ColumnPosition | undefined {
    return _columnPositionMap.get(_id);
  }

  $: ({ primaryKeyColumnId } = $columnsDataStore);
  $: isSelected =
    primaryKeyColumnId &&
    $selectedRecords.has(row.record?.[primaryKeyColumnId]);
  $: modificationState = getModificationState(
    $recordModificationState,
    row,
    primaryKeyColumnId,
  );
  $: rowWidth =
    getColumnPosition($columnPositionMap, ROW_POSITION_INDEX)?.width || 0;

  function checkAndCreateEmptyRow() {
    if (row.isAddPlaceholder) {
      void recordsData.createOrUpdateRecord(row);
    }
  }
</script>

<div
  class="row {row.state} {modificationState || ''}"
  class:selected={isSelected}
  class:is-group-header={row.isGroupHeader}
  class:is-add-placeholder={row.isAddPlaceholder}
  style={styleString}
  data-identifier={row.identifier}
  on:mousedown={checkAndCreateEmptyRow}
>
  {#if row.isNewHelpText}
    <RowPlaceholder {rowWidth} />
  {:else if row.isGroupHeader && $grouping && row.group}
    <GroupHeader {row} {rowWidth} grouping={$grouping} group={row.group} />
  {:else if row.record}
    <RowControl {primaryKeyColumnId} {row} {meta} {recordsData} />

    {#each $columnsDataStore.columns as column (column.id)}
      <RowCell
        {display}
        {row}
        bind:value={row.record[column.id]}
        {column}
        {recordsData}
        columnPosition={getColumnPosition($columnPositionMap, column.id)}
      />
    {/each}
  {/if}
</div>

<style global lang="scss">
  @import 'Row.scss';
</style>
