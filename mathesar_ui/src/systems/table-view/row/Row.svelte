<script lang="ts">
  import { ContextMenu } from '@mathesar/component-library';
  import { SheetRow, SheetRowHeaderCell } from '@mathesar/components/sheet';
  import { rowHeightPx } from '@mathesar/geometry';
  import {
    ID_ROW_CONTROL_COLUMN,
    type Row,
    getCellKey,
    getRowKey,
    getTabularDataStoreFromContext,
    isGroupHeaderRow,
    isHelpTextRow,
    isNewRecordRow,
    isPlaceholderRow,
    rowHasRecord,
  } from '@mathesar/stores/table-data';
  import { getRowSelectionId } from '@mathesar/stores/table-data/records';

  import GroupHeader from './GroupHeader.svelte';
  import NewRecordMessage from './NewRecordMessage.svelte';
  import RowCell from './RowCell.svelte';
  import RowContextOptions from './RowContextOptions.svelte';
  import RowControl from './RowControl.svelte';

  export let row: Row;
  export let style: { [key: string]: string | number };

  const tabularData = getTabularDataStoreFromContext();

  $: ({
    table,
    recordsData,
    columnsDataStore,
    meta,
    processedColumns,
    selection,
  } = $tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: ({
    rowStatus,
    rowCreationStatus,
    cellModificationStatus,
    cellClientSideErrors,
  } = meta);
  $: ({ grouping, linkedRecordSummaries } = recordsData);

  $: ({ pkColumn } = columnsDataStore);
  $: primaryKeyColumnId = $pkColumn?.id;
  $: rowKey = getRowKey(row, primaryKeyColumnId);
  $: rowSelectionId = getRowSelectionId(row);
  $: creationStatus = $rowCreationStatus.get(rowKey)?.state;
  $: status = $rowStatus.get(rowKey);
  $: wholeRowState = status?.wholeRowState;
  $: isSelected = $selection.rowIds.has(getRowSelectionId(row));
  $: hasWholeRowErrors = wholeRowState === 'failure';
  /** Including whole row errors and individual cell errors */
  $: hasAnyErrors = !!status?.errorsFromWholeRowAndCells?.length;

  function handleMouseDown(e: MouseEvent) {
    if (isPlaceholderRow(row)) {
      $tabularData.addEmptyRecord();
      e.stopPropagation(); // Prevents cell selection from starting
    }
  }
</script>

<SheetRow {style} let:htmlAttributes let:styleString>
  <div
    class="row"
    class:selected={isSelected}
    class:processing={wholeRowState === 'processing'}
    class:failed={hasWholeRowErrors}
    class:created={creationStatus === 'success'}
    class:is-new={isNewRecordRow(row)}
    class:is-group-header={isGroupHeaderRow(row)}
    class:is-add-placeholder={isPlaceholderRow(row)}
    {...htmlAttributes}
    style="--cell-height:{rowHeightPx - 1}px;{styleString}"
    on:mousedown={handleMouseDown}
  >
    {#if rowHasRecord(row)}
      <SheetRowHeaderCell
        {rowSelectionId}
        columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
      >
        <RowControl
          {primaryKeyColumnId}
          {row}
          {meta}
          {recordsData}
          {isSelected}
          hasErrors={hasAnyErrors}
        />
        <ContextMenu>
          <RowContextOptions recordPk={rowKey} {recordsData} {row} />
        </ContextMenu>
      </SheetRowHeaderCell>
    {/if}

    {#if isHelpTextRow(row)}
      <NewRecordMessage columnCount={$processedColumns.size} />
    {:else if isGroupHeaderRow(row) && $grouping && row.group}
      <GroupHeader
        {row}
        grouping={$grouping}
        group={row.group}
        processedColumnsMap={$processedColumns}
        recordSummariesForSheet={$linkedRecordSummaries}
      />
    {:else if rowHasRecord(row)}
      {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
        <RowCell
          {selection}
          {row}
          rowHasErrors={hasWholeRowErrors}
          key={getCellKey(rowKey, columnId)}
          modificationStatusMap={cellModificationStatus}
          clientSideErrorMap={cellClientSideErrors}
          bind:value={row.record[columnId]}
          {processedColumn}
          {recordsData}
          {rowKey}
          currentRoleTablePrivileges={$currentRolePrivileges}
        />
      {/each}
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
      cursor: pointer;

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
