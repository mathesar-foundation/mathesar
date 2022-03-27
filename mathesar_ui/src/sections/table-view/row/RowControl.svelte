<script lang="ts">
  import { faSync, faPlus } from '@fortawesome/free-solid-svg-icons';
  import { Checkbox, Icon } from '@mathesar-component-library';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
    getGenericModificationStatus,
  } from '@mathesar/stores/table-data';
  import type {
    Meta,
    RecordsData,
    Row,
  } from '@mathesar/stores/table-data/types';

  export let primaryKeyColumnId: number | undefined = undefined;
  export let row: Row;
  export let meta: Meta;
  export let recordsData: RecordsData;

  $: ({ selectedRecords, recordModificationState, pagination } = meta);
  $: ({ savedRecords, newRecords, totalCount } = recordsData);

  $: primaryKeyValue = primaryKeyColumnId
    ? row.record?.[primaryKeyColumnId]
    : undefined;
  $: isRowSelected = ($selectedRecords as Set<unknown>).has(primaryKeyValue);
  $: genericModificationStatus = getGenericModificationStatus(
    $recordModificationState,
    row,
    primaryKeyColumnId,
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

<div
  class="cell row-control"
  style="width:{ROW_CONTROL_COLUMN_WIDTH}px;left:0px"
>
  <div class="control">
    {#if row.isAddPlaceholder}
      <Icon data={faPlus} />
    {:else}
      {#if typeof row.rowIndex === 'number'}
        <span class="number">
          {row.rowIndex +
            (row.isNew
              ? ($totalCount ?? 0) - $savedRecords.length - $newRecords.length
              : $pagination.offset) +
            1}
          {#if row.isNew}
            *
          {/if}
        </span>
      {/if}

      {#if primaryKeyValue}
        <Checkbox checked={isRowSelected} on:change={selectionChanged} />
      {/if}
    {/if}
  </div>

  {#if genericModificationStatus === 'inprocess'}
    <Icon class="mod-indicator" size="0.9em" data={faSync} spin={true} />
  {/if}
</div>
