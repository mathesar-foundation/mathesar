<script lang="ts">
  import { tick } from 'svelte';
  import {
    ContextMenu,
    MenuItem,
    WritableMap,
  } from '@mathesar-component-library';
  import {
    isCellActive,
    scrollBasedOnActiveCell,
  } from '@mathesar/stores/table-data';
  import type {
    Row,
    Display,
    RecordsData,
    CellKey,
  } from '@mathesar/stores/table-data/types';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import type { RequestStatus } from '@mathesar/utils/api';
  import { States } from '@mathesar/utils/api';
  import { SheetCell } from '@mathesar/components/sheet';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import type { DataForRecordSummaryInFkCell } from '@mathesar/stores/table-data/record-summaries/recordSummaryTypes';
  import { iconSetToNull } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    isCellSelected,
    Selection,
  } from '@mathesar/stores/table-data/selection';
  import CellErrors from './CellErrors.svelte';
  import CellBackground from './CellBackground.svelte';
  import RowCellBackgrounds from './RowCellBackgrounds.svelte';

  export let recordsData: RecordsData;
  export let display: Display;
  export let selection: Selection;
  export let row: Row;
  export let rowIsSelected = false;
  export let rowIsProcessing = false;
  export let rowHasErrors = false;
  export let key: CellKey;
  export let modificationStatusMap: WritableMap<CellKey, RequestStatus>;
  export let processedColumn: ProcessedColumn;
  export let clientSideErrorMap: WritableMap<CellKey, string[]>;
  export let value: unknown = undefined;
  export let dataForRecordSummaryInFkCell:
    | DataForRecordSummaryInFkCell
    | undefined = undefined;

  $: recordsDataState = recordsData.state;
  $: ({ column, linkFk } = processedColumn);
  $: ({ activeCell } = display);
  $: isActive = $activeCell && isCellActive($activeCell, row, column);
  $: ({ selectedCells } = selection);

  /**
   * The name indicates that this boolean is only true when more than one cell
   * is selected. However, because of the bug that [the active cell and selected
   * cells do not remain in sync when using keyboard][1] this boolean is
   * sometimes true even when multiple cells are selected. This is to
   * differentiate between different active and selected cell using blue
   * background styling for selected cell and blue border styling for active
   * cell.
   *
   * The above bug can be fixed when following two conditions are met
   *
   * - We are working on keyboard accessability of the application.
   * - `selectedCells` and `activeCell` are merged in a single store.
   *
   * [1]: https://github.com/centerofci/mathesar/issues/1534
   */
  $: isSelectedInRange =
    isCellSelected($selectedCells, row, column) && $selectedCells.size > 1;
  $: modificationStatus = $modificationStatusMap.get(key);
  $: serverErrors =
    modificationStatus?.state === 'failure' ? modificationStatus?.errors : [];
  $: clientErrors = $clientSideErrorMap.get(key) ?? [];
  $: errors = [...serverErrors, ...clientErrors];
  $: canSetNull = column.nullable && value !== null;
  $: hasError = !!errors.length;
  $: isProcessing = modificationStatus?.state === 'processing';
  $: isEditable = !column.primary_key;
  $: getRecordPageUrl = $storeToGetRecordPageUrl;
  $: recordPageLinkHref = (() => {
    if (linkFk) {
      const tableId = linkFk.referent_table;
      return getRecordPageUrl({ tableId, recordId: value });
    }
    if (column.primary_key) {
      return getRecordPageUrl({ recordId: value });
    }
    return undefined;
  })();

  async function checkTypeAndScroll(type?: string) {
    if (type === 'moved') {
      await tick();
      scrollBasedOnActiveCell();
    }
  }

  async function moveThroughCells(
    event: CustomEvent<{ originalEvent: KeyboardEvent; key: string }>,
  ) {
    const { originalEvent } = event.detail;
    const type = display.handleKeyEventsOnActiveCell(originalEvent);
    if (type) {
      originalEvent.stopPropagation();
      originalEvent.preventDefault();

      await checkTypeAndScroll(type);
    }
  }

  async function setValue(newValue: unknown) {
    if (newValue === value) {
      return;
    }
    value = newValue;
    const updatedRow = row.isNew
      ? await recordsData.createOrUpdateRecord(row, column)
      : await recordsData.updateCell(row, column);
    value = updatedRow.record?.[column.id] ?? value;
  }

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
  }
</script>

<SheetCell columnIdentifierKey={column.id} let:htmlAttributes let:style>
  <div
    class="cell editable-cell"
    class:error={hasError}
    class:modified={modificationStatus?.state === 'success'}
    class:is-active={isActive}
    class:is-processing={isProcessing}
    class:is-pk={column.primary_key}
    {...htmlAttributes}
    {style}
  >
    <CellBackground when={hasError} color="var(--cell-bg-color-error)" />
    <CellBackground when={!isEditable} color="var(--cell-bg-color-disabled)" />
    {#if !(isEditable && isActive)}
      <!--
      We hide these backgrounds when the cell is editable and active because a
      white background better communicates that the user can edit the active
      cell.
    -->
      <RowCellBackgrounds
        isSelected={rowIsSelected}
        isProcessing={rowIsProcessing}
        hasErrors={rowHasErrors}
      />
    {/if}

    <CellFabric
      columnFabric={processedColumn}
      {isActive}
      {isSelectedInRange}
      {value}
      {dataForRecordSummaryInFkCell}
      showAsSkeleton={$recordsDataState === States.Loading}
      disabled={!isEditable}
      on:movementKeyDown={moveThroughCells}
      on:activate={() => {
        display.selectCell(row, column);
        // Activate event initaites the selection process
        selection.onStartSelection(row, column);
      }}
      on:update={valueUpdated}
      {recordPageLinkHref}
      horizontalAlignment={column.primary_key ? 'left' : undefined}
      on:mouseenter={() => {
        // This enables the click + drag to
        // select multiple cells
        selection.onMouseEnterWhileSelection(row, column);
      }}
    />
    <ContextMenu>
      <MenuItem
        icon={iconSetToNull}
        disabled={!canSetNull}
        on:click={() => setValue(null)}
      >
        Set to <Null />
      </MenuItem>
    </ContextMenu>
    {#if errors.length}
      <CellErrors {errors} forceShowErrors={isActive} />
    {/if}
  </div>
</SheetCell>

<style lang="scss">
  .editable-cell.cell {
    user-select: none;
    background: var(--cell-bg-color-base);

    &.is-active {
      z-index: 5;
      border-color: transparent;
      min-height: 100%;
      height: auto !important;
    }

    &.error,
    &.is-processing {
      color: var(--cell-text-color-processing);
    }
  }
</style>
