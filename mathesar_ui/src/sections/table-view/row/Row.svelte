<script lang="ts">
  import { getContext } from 'svelte';
  import { DEFAULT_ROW_RIGHT_PADDING } from '@mathesar/stores/table-data';
  import type {
    ColumnPositionMap,
    TabularDataStore,
    TabularData,
    TableRecord,
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

  $: isSelected = $selected[row?.[$columns?.primaryKey]] || false;
</script>

<div class="row {row.__state || ''}" class:selected={isSelected}
      style={styleString}>
  <RowControl {rowNumber} primaryKey={$columns.primaryKey}
              {row} bind:selected={$selected}/>

  {#each $columns.data as column (column.name)}
    <RowCell columnPosition={$columnPositionMap.get(column.name)} {row} {column}/>
  {/each}
</div>
 