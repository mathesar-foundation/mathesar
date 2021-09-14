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

  export let index: number;
  export let row: TableRecord;
  export let style: { [key: string]: string | number };

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columns, meta, display } = $tabularData as TabularData);
  $: ({ columnPositionMap } = display as TabularData['display']);
  $: ({ offset, selected } = meta as TabularData['meta']);

  $: rowNumber = $offset as number + index + 1;

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

<div class="row {row.__state || ''}" class:selected={isSelected}
      style={styleString}>
  <RowControl {rowNumber} primaryKey={$columns.primaryKey}
              {row} bind:selected={$selected}/>

  {#each $columns.data as column (column.name)}
    <RowCell columnPosition={getColumnPosition($columnPositionMap, column.name)} {row} {column}/>
  {/each}
</div>
 