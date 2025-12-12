<script lang="ts">
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import RowCellBackgrounds from '@mathesar/components/RowCellBackgrounds.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import {
    type DisplayRowDescriptor,
    type Meta,
    type Row,
    isDraftRecordRow,
    isPlaceholderRecordRow,
    isRecordRow,
  } from '@mathesar/stores/table-data';
  import { getRowNumber } from '@mathesar/stores/table-data/display';
  import { Icon, iconLoading } from '@mathesar-component-library';

  import CellErrors from './CellErrors.svelte';

  const DRAFT_ROW_INDICATOR = '*';

  export let row: Row;
  export let rowDescriptor: DisplayRowDescriptor;
  export let meta: Meta;
  export let isSelected = false;
  export let hasErrors = false;

  $: ({ rowStatus } = meta);
  $: status = $rowStatus.get(row.identifier);
  $: state = status?.wholeRowState;
  $: errors = status?.errorsFromWholeRowAndCells ?? [];
</script>

<CellBackground color="var(--cell-bg-color-header)" />
<RowCellBackgrounds {isSelected} {hasErrors} />
<div class="control">
  {#if isPlaceholderRecordRow(row)}
    <Icon {...iconAddNew} />
  {:else if isRecordRow(row)}
    <span class="number">
      {getRowNumber(rowDescriptor)}
      {#if isDraftRecordRow(row)}{DRAFT_ROW_INDICATOR}{/if}
    </span>
  {/if}
</div>

{#if state === 'processing'}
  <Icon class="mod-indicator" size="0.9em" {...iconLoading} />
{/if}

{#if errors.length}
  <CellErrors serverErrors={errors} />
{/if}

<style lang="scss">
  .control {
    // To avoid text selection while while dragging through rows for multi-row
    // selection
    user-select: none;
    -webkit-user-select: none; /* Safari */

    .number {
      white-space: nowrap;
    }
  }
</style>
