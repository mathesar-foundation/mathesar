<script lang="ts">
  import type {
    TableColumnData,
    TableDisplayData,
  } from '@mathesar/stores/tableData';
  import { Skeleton } from '@mathesar-components';

  export let offset: number;
  export let index: number;
  export let columns: TableColumnData;
  export let loading = false;
  export let isGrouped = false;
  export let row: { [key: string]: unknown };
  export let columnPosition: TableDisplayData['columnPosition'];
  export let style: { [key: string]: string | number };

  $: rowNumber = isGrouped
    ? offset + (row.__index as number)
    : offset + index;

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPosition: TableDisplayData['columnPosition'],
  ) {
    if (!_style) {
      return '';
    }
    const totalWidth = _columnPosition.get('__row').width;
    return `position:${_style.position};left:${_style.left}px;`
            + `top:${_style.top}px;height:${_style.height}px;`
            + `width:${totalWidth + 100}px`;
  }

  $: styleString = calculateStyle(style, columnPosition);
</script>

<div class:group={row.__isGroupRow} style={styleString}>
  {#if row.__isGroupRow}
    <div class="cell">
      {row.key}: {row.count}
    </div>

  {:else}
    {#each columns.data as column (column.name)}
      <div class="cell" style="
        width:{columnPosition.get(column.name).width}px;
        left:{columnPosition.get(column.name).left}px;">
        {row[column.name]}
        <Skeleton {loading}/>
      </div>
    {/each}
  {/if}
</div>
