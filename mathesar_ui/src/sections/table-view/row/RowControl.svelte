<script lang="ts">
  import {
    faSync,
  } from '@fortawesome/free-solid-svg-icons';
  import { Checkbox, Icon } from '@mathesar-components';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
    GROUP_MARGIN_LEFT,
    isModificationInProgress,
  } from '@mathesar/stores/table-data';
  import type {
    Meta,
    TableRecord,
    ModificationType,
  } from '@mathesar/stores/table-data/types';

  export let isGrouped = false;
  export let primaryKeyColumn: string = null;
  export let row: TableRecord;
  export let meta: Meta;

  $: ({ selectedRecords, recordModificationState } = meta);

  $: primaryKeyValue = row?.[primaryKeyColumn] ?? null;
  $: isRowSelected = ($selectedRecords as Set<unknown>).has(primaryKeyValue);
  $: isModInProgress = isModificationInProgress(
    ($recordModificationState as Map<unknown, ModificationType>).get(primaryKeyValue),
  );

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

    {#if isModInProgress}
      <Icon class="mod-indicator" size='0.9em' data={faSync} spin={true}/>
    {/if}
  {/if}
</div>
