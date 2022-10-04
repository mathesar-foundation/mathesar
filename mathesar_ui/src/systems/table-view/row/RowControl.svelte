<script lang="ts">
  import { Icon, iconLoading } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
  import {
    getRowKey,
    isNewRecordRow,
    isPlaceholderRow,
    rowHasRecord,
    type Meta,
    type RecordsData,
    type Row,
  } from '@mathesar/stores/table-data';
  import CellBackground from './CellBackground.svelte';
  import CellErrors from './CellErrors.svelte';
  import RowCellBackgrounds from './RowCellBackgrounds.svelte';

  export let primaryKeyColumnId: number | undefined = undefined;
  export let row: Row;
  export let meta: Meta;
  export let recordsData: RecordsData;
  export let isSelected = false;
  export let hasErrors = false;

  $: ({ pagination, rowStatus } = meta);
  $: ({ savedRecords, newRecords, totalCount } = recordsData);
  $: rowKey = getRowKey(row, primaryKeyColumnId);
  $: status = $rowStatus.get(rowKey);
  $: state = status?.wholeRowState;
  $: errors = status?.errorsFromWholeRowAndCells ?? [];
</script>

<CellBackground color="var(--cell-bg-color-header)" />
<RowCellBackgrounds {isSelected} {hasErrors} />
<div class="control">
  {#if isPlaceholderRow(row)}
    <Icon {...iconAddNew} />
  {:else if rowHasRecord(row)}
    <span class="number">
      {row.rowIndex +
        (isNewRecordRow(row)
          ? ($totalCount ?? 0) - $savedRecords.length - $newRecords.length
          : $pagination.offset) +
        1}
      {#if isNewRecordRow(row)}
        *
      {/if}
    </span>
  {/if}
</div>

{#if state === 'processing'}
  <Icon class="mod-indicator" size="0.9em" {...iconLoading} />
{/if}

{#if errors.length}
  <CellErrors {errors} />
{/if}
