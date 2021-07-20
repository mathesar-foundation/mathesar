<script lang="ts">
  import type {
    TableColumnData,
    ColumnPosition,
    TableRecord,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_ROW_HEIGHT,
  } from '@mathesar/stores/tableData';
  import { Skeleton } from '@mathesar-components';

  export let index: number;
  export let columns: TableColumnData;
  export let loading = false;
  export let row: TableRecord;
  export let columnPosition: ColumnPosition;
  export let style: { [key: string]: string | number };

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPosition: ColumnPosition,
    isGroupRow = false,
  ) {
    if (!_style) {
      return {};
    }
    const totalWidth = _columnPosition.get('__row').width;
    const styleStr = `position:${_style.position};left:${_style.left}px;`
            + `width:${totalWidth + 100}px`;

    if (isGroupRow) {
      const top = _style.top as number;
      const height = _style.height as number;
      return {
        group: `${styleStr};top:${top}px;height:${GROUP_ROW_HEIGHT}px;`,
        default: `${styleStr};top:${top + GROUP_ROW_HEIGHT}px;height:${height - GROUP_ROW_HEIGHT}px;`,
      };
    }

    return {
      default: `${styleStr};top:${_style.top}px;height:${_style.height}px;`,
    };
  }

  $: styleString = calculateStyle(style, columnPosition, !!row.__groupInfo);
</script>

{#if row.__groupInfo}
  <div class="group" style={styleString.group}>
    <div class="values">
      {#each row.__groupInfo.columns as column (column)}
        <span class="tag">{column}: {row[column]}</span>
      {/each}
    </div>
  </div>
{/if}

<div class="row" style={styleString.default}>
  <div class="cell row-number" style="width:{DEFAULT_COUNT_COL_WIDTH}px">
    {index + 1}
  </div>

  {#each columns.data as column (column.name)}
    <div class="cell" style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left}px;">
      {typeof row[column.name] !== 'undefined' ? row[column.name] : ''}
      <Skeleton {loading}/>
    </div>
  {/each}
</div>
