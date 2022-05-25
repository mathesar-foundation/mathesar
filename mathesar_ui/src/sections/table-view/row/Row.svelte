<script lang="ts">
  import { getContext } from 'svelte';
  import { ROW_POSITION_INDEX } from '@mathesar/stores/table-data';
  import { getCellKey } from '@mathesar/stores/table-data';
  import type {
    ColumnPositionMap,
    TabularDataStore,
    Row,
  } from '@mathesar/stores/table-data/types';
  import { getRowKey } from '@mathesar/stores/table-data';
  import RowControl from './RowControl.svelte';
  import RowCell from './RowCell.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import RowPlaceholder from './RowPlaceholder.svelte';
  import type { ProcessedTableColumnMap } from '../utils';

  export let row: Row;
  export let style: { [key: string]: string | number };
  export let processedTableColumnsMap: ProcessedTableColumnMap;

  const tabularData = getContext<TabularDataStore>('tabularData');

  $: ({ recordsData, columnsDataStore, meta, display } = $tabularData);
  $: ({ columnPositionMap } = display);
  $: ({ selectedRows, rowStatus, rowCreationStatus, cellModificationStatus } =
    meta);
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
  $: ({ primaryKeyColumnId } = $columnsDataStore);
  $: rowKey = getRowKey(row, primaryKeyColumnId);
  $: creationStatus = $rowCreationStatus.get(rowKey)?.state;
  $: status = $rowStatus.get(rowKey);
  $: wholeRowState = status?.wholeRowState;
  $: rowWidth = $columnPositionMap.get(ROW_POSITION_INDEX)?.width || 0;
  $: isSelected = $selectedRows.has(rowKey);
  $: hasWholeRowErrors = wholeRowState === 'failure';
  /** Including whole row errors and individual cell errors */
  $: hasAnyErrors = !!status?.errorsFromWholeRowAndCells?.length;

  function checkAndCreateEmptyRow() {
    if (row.isAddPlaceholder) {
      void recordsData.addEmptyRecord();
    }
  }
</script>

<div
  class="row"
  class:selected={isSelected}
  class:processing={wholeRowState === 'processing'}
  class:failed={hasWholeRowErrors}
  class:created={creationStatus === 'success'}
  class:add-placeholder={row.isAddPlaceholder}
  class:new={row.isNew}
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
    <RowControl
      {primaryKeyColumnId}
      {row}
      {meta}
      {recordsData}
      {isSelected}
      hasErrors={hasAnyErrors}
    />

    {#each [...processedTableColumnsMap] as [columnId, processedColumn] (columnId)}
      <RowCell
        {display}
        {row}
        rowIsSelected={isSelected}
        rowHasErrors={hasWholeRowErrors}
        key={getCellKey(rowKey, columnId)}
        modificationStatusMap={cellModificationStatus}
        bind:value={row.record[columnId]}
        {processedColumn}
        {recordsData}
        columnPosition={$columnPositionMap.get(columnId)}
      />
    {/each}
  {/if}
</div>

<style global lang="scss">
  @import 'Row.scss';
</style>
