<script lang="ts">
  import { ContextMenu } from '@mathesar/component-library';
  import { SheetRow, SheetRowHeaderCell } from '@mathesar/components/sheet';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import {
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
  $: recordPk =
    primaryKeyColumnId && isRecordRow(row)
      ? row.record[primaryKeyColumnId]
      : undefined;

  $: rowSelectionId = getRowSelectionId(row);
  $: creationStatus = $rowCreationStatus.get(row.identifier)?.state;
  $: status = $rowStatus.get(row.identifier);
  $: wholeRowState = status?.wholeRowState;
  $: isSelected = $selection.rowIds.has(getRowSelectionId(row));
  $: hasWholeRowErrors = wholeRowState === 'failure';
  /** Including whole row errors and individual cell errors */
  $: hasAnyErrors = !!status?.errorsFromWholeRowAndCells?.length;
  $: isTableEditable = $currentRolePrivileges.has('UPDATE');

  function handleMouseDown(e: MouseEvent) {
    if (isPlaceholderRecordRow(row)) {
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
    class:is-group-header={isGroupHeaderRow(row)}
    class:is-add-placeholder={isPlaceholderRecordRow(row)}
    {...htmlAttributes}
    style="--cell-height:{ROW_HEIGHT_PX - 1}px;{styleString}"
    on:mousedown={handleMouseDown}
  >
    {#if isRecordRow(row)}
      <SheetRowHeaderCell
        {rowSelectionId}
        columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
      >
        <RowControl
          {row}
          {meta}
          {recordsData}
          {isSelected}
          hasErrors={hasAnyErrors}
        />
        <ContextMenu>
          <RowContextOptions {recordPk} {recordsData} {row} {isTableEditable} />
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
          currentRoleTablePrivileges={$currentRolePrivileges}
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
