<script lang="ts">
  import { map } from 'iter-tools';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import {
    Sheet,
    SheetHeader,
    SheetOriginCell,
    SheetRow,
    SheetRowHeaderCell,
    SheetVirtualRows,
  } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/clipboard';
  import { ROW_HEADER_WIDTH_PX, ROW_HEIGHT_PX } from '@mathesar/geometry';
  import { toast } from '@mathesar/stores/toast';
  import { arrayIndex } from '@mathesar/utils/typeUtils';
  import { ImmutableMap } from '@mathesar-component-library';

  import type QueryManager from '../QueryManager';
  import { type QueryRunner, getRowSelectionId } from '../QueryRunner';

  import QueryRunErrors from './QueryRunErrors.svelte';
  import ResultHeaderCell from './ResultHeaderCell.svelte';
  import ResultRowCell from './ResultRowCell.svelte';

  export let queryHandler: QueryRunner | QueryManager;

  const ID_ROW_CONTROL_COLUMN = 'row-control';
  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, ROW_HEADER_WIDTH_PX],
  ]);

  $: ({
    query,
    processedColumns,
    rowsData,
    selectableRowsMap,
    pagination,
    runState,
    selection,
    inspector,
  } = queryHandler);
  $: ({ initial_columns } = $query);
  $: clipboardHandler = new SheetClipboardHandler({
    copyingContext: {
      getRows: () =>
        new Map(map(([k, r]) => [k, r.record], get(selectableRowsMap))),
      getColumns: () => get(processedColumns),
      getRecordSummaries: () => new ImmutableMap(),
    },
    getSelection: () => get(selection),
    showToastInfo: toast.info,
    showToastError: toast.error,
  });
  $: ({ columnIds } = $selection);
  $: recordRunState = $runState?.state;
  $: errors = $runState?.state === 'failure' ? $runState.errors : undefined;
  $: columnList = [...$processedColumns.values()];
  $: sheetColumns = columnList.length
    ? [{ id: ID_ROW_CONTROL_COLUMN }, ...columnList]
    : [];
  $: rows = $rowsData.rows;
  // Show a dummy ghost row when there are no records
  $: showDummyGhostRow =
    (recordRunState === 'success' || recordRunState === 'processing') &&
    !rows.length;
  $: sheetItemCount = showDummyGhostRow ? 1 : rows.length;
</script>

<div data-identifier="query-run-result">
  {#if !initial_columns.length}
    <div class="empty-state">
      {$_('add_columns_to_exploration_empty_message')}
    </div>
  {:else if errors}
    <div class="empty-state">
      <QueryRunErrors {errors} {queryHandler} />
    </div>
  {:else}
    <Sheet
      columns={sheetColumns}
      getColumnIdentifier={(c) => c.id}
      {columnWidths}
      {clipboardHandler}
      usesVirtualList
      {selection}
      onCellSelectionStart={(cell) => {
        if (cell.type === 'column-header-cell') {
          inspector.activate('column');
        }
      }}
    >
      <SheetHeader>
        <SheetOriginCell columnIdentifierKey={ID_ROW_CONTROL_COLUMN} />
        {#each columnList as processedQueryColumn (processedQueryColumn.id)}
          <ResultHeaderCell
            {processedQueryColumn}
            queryRunner={queryHandler}
            isSelected={columnIds.has(processedQueryColumn.id)}
          />
        {/each}
      </SheetHeader>

      <SheetVirtualRows
        itemCount={sheetItemCount}
        paddingBottom={30}
        itemSize={() => ROW_HEIGHT_PX}
        let:items
      >
        {#each items as item (item.key)}
          {@const row = arrayIndex(rows, item.index)}
          {@const rowSelectionId = (row && getRowSelectionId(row)) ?? ''}
          {@const isSelected = $selection.rowIds.has(rowSelectionId)}
          {#if row || showDummyGhostRow}
            <SheetRow style={item.style} let:htmlAttributes let:styleString>
              <div
                {...htmlAttributes}
                style="--cell-height:{ROW_HEIGHT_PX - 1}px;{styleString}"
              >
                <SheetRowHeaderCell
                  {rowSelectionId}
                  columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
                >
                  <CellBackground color="var(--cell-bg-color-header)" />
                  <CellBackground
                    when={isSelected}
                    color="var(--cell-bg-color-row-selected)"
                  />
                  {$pagination.offset + item.index + 1}
                </SheetRowHeaderCell>

                {#each columnList as processedQueryColumn (processedQueryColumn.id)}
                  <ResultRowCell
                    {row}
                    {rowSelectionId}
                    column={processedQueryColumn}
                    {recordRunState}
                    {selection}
                  />
                {/each}
              </div>
            </SheetRow>
          {/if}
        {/each}
      </SheetVirtualRows>
    </Sheet>
  {/if}
</div>

<style lang="scss">
  [data-identifier='query-run-result'] {
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .empty-state {
      padding: 1rem;
      position: absolute;
      right: 0;
      left: 0;
      bottom: 0;
      top: 0;
      overflow: auto;
    }

    :global(button.column-name-wrapper) {
      flex: 1;
      padding: 6px 8px;
      overflow: hidden;
      height: 100%;
      display: block;
      overflow: hidden;
      text-align: left;
    }

    :global(.column-name-wrapper.selected) {
      background: var(--slate-200) !important;
    }
    :global([data-sheet-element='data-cell'].selected) {
      background: var(--slate-100);
    }
  }
</style>
