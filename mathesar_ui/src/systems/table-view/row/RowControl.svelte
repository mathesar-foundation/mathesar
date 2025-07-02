<script lang="ts">
  import { _ } from 'svelte-i18n';

  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import RowCellBackgrounds from '@mathesar/components/RowCellBackgrounds.svelte';
  import {
    iconAddNew,
    iconNewlyAdded,
    iconUnsavedChanges,
  } from '@mathesar/icons';
  import {
    type DisplayRowDescriptor,
    type Meta,
    type Row,
    isDraftRecordRow,
    isPlaceholderRecordRow,
    isRecordRow,
  } from '@mathesar/stores/table-data';
  import { RowOrigin } from '@mathesar/stores/table-data/display';
  import { Icon, Tooltip, iconLoading } from '@mathesar-component-library';

  import CellErrors from './CellErrors.svelte';

  export let row: Row;
  export let rowDescriptor: DisplayRowDescriptor;
  export let meta: Meta;
  export let isSelected = false;
  export let hasErrors = false;

  $: ({ pagination, rowStatus } = meta);
  $: status = $rowStatus.get(row.identifier);
  $: state = status?.wholeRowState;
  $: errors = status?.errorsFromWholeRowAndCells ?? [];
</script>

<CellBackground color="var(--cell-bg-color-header)" />
<RowCellBackgrounds {isSelected} {hasErrors} />

<div class="control">
  {#if isPlaceholderRecordRow(row)}
    <Icon {...iconAddNew} />
  {:else if state === 'processing'}
    <Icon {...iconLoading} />
  {:else if isRecordRow(row)}
    {#if rowDescriptor.rowOrigin === RowOrigin.FetchedFromDb}
      <div class="number">
        {rowDescriptor.rowNumber + $pagination.offset + 1}
      </div>
    {:else if isDraftRecordRow(row)}
      <div class="unsaved-changes-indicator">
        <Icon {...iconUnsavedChanges} />
      </div>
    {:else if rowDescriptor.rowOrigin === RowOrigin.NewlyCreatedViaUi}
      <Tooltip placements={['top-start', 'bottom-start']}>
        <div slot="trigger" class="new-record-indicator">
          <Icon {...iconNewlyAdded} />
        </div>
        <div slot="content">
          {$_('new_record_indicator_help_text')}
        </div>
      </Tooltip>
    {/if}
  {/if}
</div>

{#if errors.length}
  <CellErrors serverErrors={errors} />
{/if}

<style lang="scss">
  .control {
    // To avoid text selection while while dragging through rows for multi-row
    // selection
    user-select: none;
    -webkit-user-select: none; /* Safari */
  }

  .new-record-indicator {
    font-size: 1.15rem;
    opacity: 0.25;
  }

  .unsaved-changes-indicator {
    font-size: 1.15rem;
    opacity: 0.25;
    &:hover {
      opacity: 0.4;
    }
  }

  .number {
    white-space: nowrap;
  }
</style>
