<script lang="ts">
  import { ContextMenu } from '@mathesar/component-library';
  import { SheetRow, SheetRowHeaderCell } from '@mathesar/components/sheet';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import {
    type DisplayRowDescriptor,
    ID_ROW_CONTROL_COLUMN,
    type Row,
    getCellKey,
    getRowSelectionId,
    getTabularDataStoreFromContext,
    isGroupHeaderRow,
    isHelpTextRow,
    isPlaceholderRecordRow,
    isRecordRow,
  } from '@mathesar/stores/table-data';
  import { getFirstEditableColumn } from '@mathesar/stores/table-data/processedColumns';

  import GroupHeader from './GroupHeader.svelte';
  import NewRecordMessage from './NewRecordMessage.svelte';
  import RowCell from './RowCell.svelte';
  import RowContextOptions from './RowContextOptions.svelte';
  import RowControl from './RowControl.svelte';

  export let row: Row;
  export let rowDescriptor: DisplayRowDescriptor;
  export let style: { [key: string]: string | number };
  export let quickViewRecord: (tableOid: number, recordId: unknown) => void;

  const tabularData = getTabularDataStoreFromContext();

  $: ({
    recordsData,
    columnsDataStore,
    meta,
    processedColumns,
    selection,
    canUpdateRecords,
    canDeleteRecords,
    canInsertRecords,
    table,
  } = $tabularData);
  $: ({
    rowStatus,
    rowCreationStatus,
    cellModificationStatus,
    cellClientSideErrors,
  } = meta);
  $: ({ grouping, linkedRecordSummaries } = recordsData);

  $: ({ pkColumn } = columnsDataStore);
  $: primaryKeyColumnId = $pkColumn?.id;
  $: recordPk =
    primaryKeyColumnId && isRecordRow(row)
      ? row.record[primaryKeyColumnId]
      : undefined;
  $: isPlaceholderRow = isPlaceholderRecordRow(row);
  $: rowSelectionId = getRowSelectionId(row);
  $: creationStatus = $rowCreationStatus.get(row.identifier)?.state;
  $: status = $rowStatus.get(row.identifier);
  $: wholeRowState = status?.wholeRowState;
  $: isSelected = $selection.rowIds.has(getRowSelectionId(row));
  $: hasWholeRowErrors = wholeRowState === 'failure';
  /** Including whole row errors and individual cell errors */
  $: hasAnyErrors = !!status?.errorsFromWholeRowAndCells?.length;

  async function handleRowHeaderMouseDown(e: MouseEvent) {
    if (!isPlaceholderRecordRow(row)) return;

    e.stopPropagation(); // Prevents cell selection from starting

    await recordsData.addEmptyRecord();

    // Select the first editable cell in the newly added row.
    const columns = $processedColumns.values();
    const columnId = getFirstEditableColumn(columns)?.id.toString();
    if (!columnId) return;
    selection.update((s) => s.ofNewRecordDataEntryCell(columnId));
  }
</script>

<SheetRow {style} let:htmlAttributes let:styleString>
  <div
    class="row"
    class:selected={isSelected}
    class:processing={wholeRowState === 'processing'}
    class:failed={hasWholeRowErrors}
    class:created={creationStatus === 'success'}
    class:is-group-header={isGroupHeaderRow(row)}
    class:is-add-placeholder={isPlaceholderRecordRow(row)}
    {...htmlAttributes}
    style="--cell-height:{ROW_HEIGHT_PX - 1}px;{styleString}"
  >
    {#if isRecordRow(row)}
      <SheetRowHeaderCell
        {rowSelectionId}
        columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
        isWithinPlaceholderRow={isPlaceholderRow}
        onMouseDown={handleRowHeaderMouseDown}
      >
        <RowControl
          {row}
          {rowDescriptor}
          {meta}
          {isSelected}
          hasErrors={hasAnyErrors}
        />
        <ContextMenu>
          <RowContextOptions
            {recordPk}
            {recordsData}
            {row}
            canInsertRecords={$canInsertRecords}
            canDeleteRecords={$canDeleteRecords}
            quickViewThisRecord={() => quickViewRecord(table.oid, recordPk)}
          />
        </ContextMenu>
      </SheetRowHeaderCell>
    {/if}

    {#if isGroupHeaderRow(row) && $grouping}
      <GroupHeader
        {row}
        grouping={$grouping}
        group={row.group}
        processedColumnsMap={$processedColumns}
        recordSummariesForSheet={$linkedRecordSummaries}
      />
    {:else if isRecordRow(row)}
      {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
        <RowCell
          tableOid={table.oid}
          {selection}
          {row}
          rowHasErrors={hasWholeRowErrors}
          key={getCellKey(row.identifier, columnId)}
          modificationStatusMap={cellModificationStatus}
          clientSideErrorMap={cellClientSideErrors}
          bind:value={row.record[columnId]}
          {processedColumn}
          {recordsData}
          {recordPk}
          canInsertRecords={$canInsertRecords}
          canUpdateRecords={$canUpdateRecords}
          canDeleteRecords={$canDeleteRecords}
          {quickViewRecord}
        />
      {/each}
    {:else if isHelpTextRow(row)}
      <NewRecordMessage columnCount={$processedColumns.size} />
    {/if}
  </div>
</SheetRow>

<style lang="scss">
  .row {
    user-select: none;
    -webkit-user-select: none;

    &.processing {
      pointer-events: none;
    }

    &:not(:hover) :global(.cell-bg-row-hover) {
      display: none;
    }

    &.is-add-placeholder {
      // Hide the display of cell values like `NULL` and `DEFAULT` in the
      // placeholder row. (There is probably a cleaner way to do this via props
      // instead of global CSS, but oh well).
      :global(
          [data-sheet-element='data-cell']
            .cell-fabric
            .cell-wrapper:not(.is-edit-mode)
            > *
        ) {
        visibility: hidden;
      }
    }
  }
</style>
