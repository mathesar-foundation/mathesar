<script lang="ts">
  import { Checkbox } from '@mathesar-components';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
    GROUP_MARGIN_LEFT,
  } from '@mathesar/stores/table-data';
  import type {
    Meta,
    TableRecord,
  } from '@mathesar/stores/table-data/types';

  export let isGrouped = false;
  export let primaryKeyColumn: string = null;
  export let row: TableRecord;
  export let meta: Meta;

  $: ({ selectedRecords } = meta);

  $: primaryKeyValue = row?.[primaryKeyColumn] ?? null;
  $: isRowSelected = ($selectedRecords as Set<unknown>).has(primaryKeyValue);

  function selectionChanged(event: CustomEvent<{ checked: boolean }>) {
    const { checked } = event.detail;
    if (checked) {
      meta.selectRecordByPrimaryKey(primaryKeyValue);
    } else {
      meta.deSelectRecordByPrimaryKey(primaryKeyValue);
    }
  }
</script>

<div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;
            left:{isGrouped ? GROUP_MARGIN_LEFT : 0}px">
  
  {#if !row.__isGroupHeader}
    {#if row.__rowNumber}
      <span class="number">{row.__rowNumber}</span>
    {/if}

    {#if primaryKeyValue}
      <Checkbox checked={isRowSelected} on:change={selectionChanged}/>
    {/if}
  {/if}
</div>
