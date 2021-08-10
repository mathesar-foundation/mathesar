<script lang="ts">
  import type {
    TableColumnData,
    ColumnPosition,
    TableRecord,
    GroupData,
  } from '@mathesar/stores/tableData';
  import {
    GROUP_ROW_HEIGHT,
    GROUP_MARGIN_LEFT,
    DEFAULT_ROW_RIGHT_PADDING,
  } from '@mathesar/stores/tableData';
  import GroupHeader from './GroupHeader.svelte';
  import RowControl from './RowControl.svelte';

  export let index: number;
  export let columns: TableColumnData;
  export let row: TableRecord;
  export let isGrouped = false;
  export let columnPosition: ColumnPosition;
  export let style: { [key: string]: string | number };
  export let groupData: GroupData;
  export let selected: Record<string | number, boolean>;

  function calculateStyle(
    _style: { [key: string]: string | number },
    _columnPosition: ColumnPosition,
    _isGrouped = false,
    isGroupHeaderRow = false,
  ) {
    if (!_style) {
      return {};
    }
    const totalWidth = _columnPosition.get('__row').width;
    const left = _isGrouped ? _style.left as number + GROUP_MARGIN_LEFT : _style.left;

    const styleStr = `position:${_style.position};left:${left}px`;

    if (isGrouped && isGroupHeaderRow) {
      const top = _style.top as number;
      const height = _style.height as number;
      return {
        group: `${styleStr};top:${top + 25}px;height:${GROUP_ROW_HEIGHT - 25}px;`
                + `width:${totalWidth}px`,
        default: `${styleStr};top:${top + GROUP_ROW_HEIGHT}px;`
                  + `height:${height - GROUP_ROW_HEIGHT}px;`
                  + `width:${totalWidth + DEFAULT_ROW_RIGHT_PADDING}px`,
      };
    }

    return {
      default: `${styleStr};top:${_style.top}px;height:${_style.height}px;`
                + `width:${totalWidth + DEFAULT_ROW_RIGHT_PADDING}px`,
    };
  }

  $: styleString = calculateStyle(
    style,
    columnPosition,
    isGrouped,
    !!row.__groupInfo,
  );

  $: isSelected = selected[row?.[columns?.primaryKey] as string] || false;
</script>

{#if groupData && row.__groupInfo}
  <GroupHeader style={styleString.group} {row} {groupData}/>
{/if}

<div class="row {row.__state || ''}" class:in-group={isGrouped} class:selected={isSelected}
      style={styleString.default}>
  <RowControl {index} {isGrouped} primaryKey={columns.primaryKey}
              {row} bind:selected/>

  {#each columns.data as column (column.name)}
    <div class="cell" style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left}px;">
      {typeof row[column.name] !== 'undefined' ? row[column.name] : ''}

      {#if !row.__state || row.__state === 'loading'}
        <div class="loader"></div>
      {/if}
    </div>
  {/each}
</div>
