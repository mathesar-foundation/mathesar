<script lang="ts">
  import { Checkbox, Icon, iconLoading } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
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

<CellBackground color="var(--cell-bg-color-header)" />
<RowCellBackgrounds {isSelected} {hasErrors} />
<div class="control">
  {#if row.isAddPlaceholder}
    <Icon {...iconAddNew} />
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
  <Icon class="mod-indicator" size="0.9em" {...iconLoading} />
{/if}

{#if errors.length}
  <CellErrors {errors} />
{/if}
