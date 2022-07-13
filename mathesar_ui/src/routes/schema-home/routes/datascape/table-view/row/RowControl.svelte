<script lang="ts">
  import { faSync, faPlus } from '@fortawesome/free-solid-svg-icons';
  import { Checkbox, Icon } from '@mathesar-component-library';
  import { SheetCell } from '@mathesar/components/sheet';
  import { getRowKey } from '@mathesar/stores/table-data';
  import type {
    Meta,
    RecordsData,
    Row,
  } from '@mathesar/stores/table-data/types';
  import CellBackground from './CellBackground.svelte';
  import CellErrors from './CellErrors.svelte';
  import RowCellBackgrounds from './RowCellBackgrounds.svelte';

  export let primaryKeyColumnId: number | undefined = undefined;
  export let row: Row;
  export let meta: Meta;
  export let recordsData: RecordsData;
  export let isSelected = false;
  export let hasErrors = false;

  $: ({ selectedRows, pagination, rowStatus } = meta);
  $: ({ savedRecords, newRecords, totalCount } = recordsData);
  $: primaryKeyValue = primaryKeyColumnId
    ? row.record?.[primaryKeyColumnId]
    : undefined;
  $: rowKey = getRowKey(row, primaryKeyColumnId);
  $: status = $rowStatus.get(rowKey);
  $: state = status?.wholeRowState;
  $: errors = status?.errorsFromWholeRowAndCells ?? [];
  $: isRowSelected = primaryKeyValue !== undefined && $selectedRows.has(rowKey);

  function selectionChanged({ detail: checked }: CustomEvent<boolean>) {
    if (primaryKeyValue === undefined) {
      return;
    }
    if (checked) {
      meta.selectedRows.add(rowKey);
    } else {
      meta.selectedRows.delete(rowKey);
    }
  }
</script>

<SheetCell columnIdentifierKey={-1} isStatic let:htmlAttributes let:style>
  <div class="row-control" {...htmlAttributes} {style}>
    <CellBackground color="var(--cell-bg-color-header)" />
    <RowCellBackgrounds {isSelected} {hasErrors} />
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

    {#if state === 'processing'}
      <Icon class="mod-indicator" size="0.9em" data={faSync} spin={true} />
    {/if}

    {#if errors.length}
      <CellErrors {errors} />
    {/if}
  </div>
</SheetCell>

<style lang="scss">
  .row-control {
    font-size: 12px;
    padding: 7px 14px;
    color: #959595;
    left: 0;
    position: sticky;
    z-index: 10;
    display: inline-flex;
    align-items: center;
    height: 100%;

    :global(.checkbox) {
      display: none;
    }
  }
</style>
