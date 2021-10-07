<script lang="ts">
  import {
    faSync,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import { Checkbox, Icon } from '@mathesar-components';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
    getGenericModificationStatus,
  } from '@mathesar/stores/table-data';
  import type {
    Meta,
    Records,
    TableRecord,
  } from '@mathesar/stores/table-data/types';

  export let primaryKeyColumn: string = null;
  export let row: TableRecord;
  export let meta: Meta;
  export let records: Records;

  $: ({ selectedRecords, recordModificationState, offset } = meta);
  $: ({ savedRecords, newRecords, totalCount } = records);

  $: primaryKeyValue = row?.[primaryKeyColumn] ?? null;
  $: isRowSelected = ($selectedRecords as Set<unknown>).has(primaryKeyValue);
  $: genericModificationStatus = getGenericModificationStatus(
    $recordModificationState, row, primaryKeyColumn,
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

<div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;left:0px">
  <div class="control">
    {#if row.__isAddPlaceholder}
      <Icon data={faPlus}/>
    {:else}
      {#if typeof row.__rowIndex === 'number'}
        <span class="number">
          {row.__rowIndex + (
            row.__isNew ? $totalCount - $savedRecords.length - $newRecords.length : $offset
            ) + 1}
          {#if row.__isNew}
            *
          {/if}
        </span>
      {/if}

      {#if primaryKeyValue}
        <Checkbox checked={isRowSelected} on:change={selectionChanged}/>
      {/if}
    {/if}
  </div>

  {#if genericModificationStatus === 'inprocess'}
    <Icon class="mod-indicator" size='0.9em' data={faSync} spin={true}/>
  {/if}
</div>
