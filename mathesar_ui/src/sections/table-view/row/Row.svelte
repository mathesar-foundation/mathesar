<script lang="ts">
  import { getContext } from 'svelte';
  import { DEFAULT_ROW_RIGHT_PADDING } from '@mathesar/stores/table-data/meta';
  import type { ColumnPositionMap } from '@mathesar/stores/table-data/meta';
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/store';
  import type {
    TableRecord,
  } from '@mathesar/stores/table-data/records';
  import RowControl from './RowControl.svelte';

  export let index: number;
  export let row: TableRecord;
  export let style: { [key: string]: string | number };

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columns, meta } = $tabularData as TabularData);
  $: ({
    columnPositionMap, horizontalScrollOffset, offset, selected,
  } = meta as TabularData['meta']);

  $: rowNumber = $offset as number + index + 1;

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPositionMap: ColumnPositionMap,
  ) {
    if (!_style) {
      return '';
    }
    const totalWidth = _columnPositionMap.get('__row').width;
    return `position:${_style.position};left:${_style.left}px`
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
    <div class="cell" style="
      width:{$columnPositionMap.get(column.name).width}px;
      left:{$columnPositionMap.get(column.name).left}px;">
      {typeof row[column.name] !== 'undefined' ? row[column.name] : ''}

      {#if !row.__state || row.__state === 'loading'}
        <div class="loader"></div>
      {/if}
    </div>
  {/each}
</div>
