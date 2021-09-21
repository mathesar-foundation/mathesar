<script lang="ts">
  import { getContext } from 'svelte';
  import { DEFAULT_ROW_RIGHT_PADDING } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    ColumnPositionMap,
    TabularDataStore,
    TabularData,
    TableRecord,
    TableColumn,
    ModificationType,
  } from '@mathesar/stores/table-data/types';
  import RowControl from './RowControl.svelte';
  import RowCell from './RowCell.svelte';
  import GroupHeader from './GroupHeader.svelte';

  export let row: TableRecord;
  export let style: { [key: string]: string | number };

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({
    records, columns, meta, display,
  } = $tabularData as TabularData);
  $: ({ columnPositionMap } = display as TabularData['display']);
  $: ({ selectedRecords, recordModificationState } = meta as TabularData['meta']);
  $: ({ groupInfo } = records as TabularData['records']);

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
      + `width:${totalWidth + DEFAULT_ROW_RIGHT_PADDING}px`;
  }

  $: styleString = calculateStyle(
    style,
    $columnPositionMap,
  );

  function getColumnPosition(
    _columnPositionMap: ColumnPositionMap,
    _name: TableColumn['name'],
  ): ColumnPosition {
    return _columnPositionMap.get(_name);
  }

  function getModificationState(
    _row: TableRecord,
    _recordModState: Map<unknown, ModificationType>,
  ): ModificationType {
    return _recordModState.get(_row[$columns.primaryKey]);
  }

  $: isSelected = ($selectedRecords as Set<unknown>).has(row[$columns.primaryKey]);
  $: modificationState = getModificationState(row, $recordModificationState);
</script>

<div class="row {row.__state} {modificationState || ''}" class:selected={isSelected}
      class:is-group-header={row.__isGroupHeader} class:is-add-placeholder={row.__isAddPlaceholder}
      style={styleString} data-identifier={row.__identifier}>
  <RowControl primaryKeyColumn={$columns.primaryKey}
              {row} {meta}/>
  {#if row.__isAddPlaceholder}
    <div>
      
    </div>
  {:else if row.__isGroupHeader}
    <GroupHeader {row} groupColumns={$groupInfo.columns} groupCounts={$groupInfo.counts}/>
  {:else}
    {#each $columns.data as column (column.name)}
      <RowCell {display} bind:row {column} {records}
        columnPosition={getColumnPosition($columnPositionMap, column.name)}/>
    {/each}
  {/if}
</div>
 
<style global lang="scss">
  @import "Row.scss";
</style>
