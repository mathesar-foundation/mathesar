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
    TableColumnData,
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
  $: ({ selected } = meta as TabularData['meta']);

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

  function calcIsSelected(
    _selectionObj: Record<string | number, boolean>,
    _row: TableRecord,
    _columns: TableColumnData,
  ): boolean {
    const primaryKey = _columns?.primaryKey;
    if (primaryKey && _row) {
      return _selectionObj[_row[primaryKey] as string] || false;
    }
    return false;
  }

  $: isSelected = calcIsSelected($selected, row, $columns);
</script>

<div class="row {row.__state}" class:selected={isSelected}
      class:is-group-header={row.__isGroupHeader} style={styleString}>
  <RowControl primaryKey={$columns.primaryKey}
              {row} bind:selected={$selected}/>

  {#if row.__isGroupHeader}
    <GroupHeader {row} groupData={$records.groupData}/>
  {:else}
    {#each $columns.data as column (column.name)}
      <RowCell columnPosition={getColumnPosition($columnPositionMap, column.name)} {row} {column}/>
    {/each}
  {/if}
</div>
 